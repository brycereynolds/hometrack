import type { PageServerLoad, Actions } from './$types';
import { getFinancialsByListing, getQuotesByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { financialBudgets, financialCategories, listingCosts, teamMembers, quotes, activityItems } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { financial: null, quotes: [], costs: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [financial, quotes, costs] = await Promise.all([
        getFinancialsByListing(team.id, params.id, db),
        getQuotesByListing(team.id, params.id, db),
        db.query.listingCosts.findMany({
          where: and(
            eq(listingCosts.teamId, team.id),
            eq(listingCosts.listingId, params.id),
          ),
          with: {
            task: true,
            quote: true,
            vendor: true,
            action: true,
          },
          orderBy: [listingCosts.category, listingCosts.createdAt],
        }),
      ]);
      return { financial: financial ?? null, quotes, costs };
    });
  } catch {
    return { financial: null, quotes: [], costs: [] };
  }
};

export const actions: Actions = {
  createBudget: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const totalBudget = parseFloat(form.get('totalBudget') as string);

    if (isNaN(totalBudget) || totalBudget <= 0) {
      return fail(400, { error: 'Total budget must be a positive number' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db.insert(financialBudgets).values({
          id: nanoid(),
          teamId: member.teamId,
          listingId: params.id,
          totalBudget,
          spent: 0,
          remaining: totalBudget,
          pendingQuotes: 0,
        });
      });
      return { success: true };
    } catch (err) {
      console.error('createBudget error:', err);
      return fail(500, { error: 'Failed to create budget' });
    }
  },

  addCategory: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const name = (form.get('name') as string)?.trim();
    const budgeted = parseFloat(form.get('budgeted') as string);
    const budgetId = form.get('budgetId') as string;

    if (!name) return fail(400, { error: 'Category name is required' });
    if (isNaN(budgeted) || budgeted < 0) return fail(400, { error: 'Budgeted amount must be a positive number' });
    if (!budgetId) return fail(400, { error: 'Budget ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(financialCategories).values({
          id: nanoid(),
          budgetId,
          name,
          budgeted,
          actual: 0,
          variance: budgeted,
        });

        // Recalculate budget totals
        const budget = await db.query.financialBudgets.findFirst({
          where: eq(financialBudgets.id, budgetId),
          with: { categories: true },
        });
        if (budget) {
          const totalBudgeted = budget.categories.reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
          const totalActual = budget.categories.reduce((sum, c) => sum + (c.actual ?? 0), 0);
          await db.update(financialBudgets)
            .set({
              totalBudget: totalBudgeted,
              spent: totalActual,
              remaining: totalBudgeted - totalActual,
              updatedAt: new Date(),
            })
            .where(eq(financialBudgets.id, budgetId));
        }
      });
      return { success: true };
    } catch (err) {
      console.error('addCategory error:', err);
      return fail(500, { error: 'Failed to add category' });
    }
  },

  updateCategory: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const categoryId = form.get('categoryId') as string;
    const actual = parseFloat(form.get('actual') as string);

    if (!categoryId) return fail(400, { error: 'Category ID is required' });
    if (isNaN(actual) || actual < 0) return fail(400, { error: 'Actual amount must be a positive number' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const category = await db.query.financialCategories.findFirst({
          where: eq(financialCategories.id, categoryId),
        });
        if (!category) throw new Error('Category not found');

        const variance = (category.budgeted ?? 0) - actual;
        await db.update(financialCategories)
          .set({ actual, variance, updatedAt: new Date() })
          .where(eq(financialCategories.id, categoryId));

        // Recalculate budget totals
        const budget = await db.query.financialBudgets.findFirst({
          where: eq(financialBudgets.id, category.budgetId),
          with: { categories: true },
        });
        if (budget) {
          const totalBudgeted = budget.categories.reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
          const totalActual = budget.categories.reduce((sum, c) =>
            sum + (c.id === categoryId ? actual : (c.actual ?? 0)), 0);
          await db.update(financialBudgets)
            .set({
              totalBudget: totalBudgeted,
              spent: totalActual,
              remaining: totalBudgeted - totalActual,
              updatedAt: new Date(),
            })
            .where(eq(financialBudgets.id, category.budgetId));
        }
      });
      return { success: true };
    } catch (err) {
      console.error('updateCategory error:', err);
      return fail(500, { error: 'Failed to update category' });
    }
  },

  deleteCategory: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const categoryId = form.get('categoryId') as string;

    if (!categoryId) return fail(400, { error: 'Category ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const category = await db.query.financialCategories.findFirst({
          where: eq(financialCategories.id, categoryId),
        });
        if (!category) throw new Error('Category not found');

        const budgetId = category.budgetId;

        await db.delete(financialCategories)
          .where(eq(financialCategories.id, categoryId));

        // Recalculate budget totals
        const budget = await db.query.financialBudgets.findFirst({
          where: eq(financialBudgets.id, budgetId),
          with: { categories: true },
        });
        if (budget) {
          const totalBudgeted = budget.categories.reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
          const totalActual = budget.categories.reduce((sum, c) => sum + (c.actual ?? 0), 0);
          await db.update(financialBudgets)
            .set({
              totalBudget: totalBudgeted,
              spent: totalActual,
              remaining: totalBudgeted - totalActual,
              updatedAt: new Date(),
            })
            .where(eq(financialBudgets.id, budgetId));
        }
      });
      return { success: true };
    } catch (err) {
      console.error('deleteCategory error:', err);
      return fail(500, { error: 'Failed to delete category' });
    }
  },

  updateBudget: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const budgetId = form.get('budgetId') as string;

    if (!budgetId) return fail(400, { error: 'Budget ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const budget = await db.query.financialBudgets.findFirst({
          where: eq(financialBudgets.id, budgetId),
          with: { categories: true },
        });
        if (!budget) throw new Error('Budget not found');

        const totalBudgeted = budget.categories.reduce((sum, c) => sum + (c.budgeted ?? 0), 0);
        const totalActual = budget.categories.reduce((sum, c) => sum + (c.actual ?? 0), 0);

        await db.update(financialBudgets)
          .set({
            totalBudget: totalBudgeted,
            spent: totalActual,
            remaining: totalBudgeted - totalActual,
            updatedAt: new Date(),
          })
          .where(eq(financialBudgets.id, budgetId));
      });
      return { success: true };
    } catch (err) {
      console.error('updateBudget error:', err);
      return fail(500, { error: 'Failed to update budget' });
    }
  },

  addCost: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const title = (form.get('title') as string)?.trim();
    const category = (form.get('category') as string)?.trim();
    const amount = parseFloat(form.get('amount') as string);
    const status = (form.get('status') as string) || 'estimated';
    const notes = (form.get('notes') as string)?.trim() || null;

    if (!title) return fail(400, { error: 'Title is required' });
    if (isNaN(amount) || amount < 0) return fail(400, { error: 'Amount must be a positive number' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db.insert(listingCosts).values({
          teamId: member.teamId,
          listingId: params.id,
          title,
          category: category || 'Uncategorized',
          amount,
          status: status as 'estimated' | 'quoted' | 'committed' | 'paid',
          notes,
        });

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId: member.teamId,
          listingId: params.id,
          type: 'system',
          authorName: member.name,
          authorInitials: member.initials ?? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          content: `Cost added: ${title} — $${amount.toLocaleString()}`,
          timestamp: new Date(),
        });
      });
      return { success: true };
    } catch (err) {
      console.error('addCost error:', err);
      return fail(500, { error: 'Failed to add cost' });
    }
  },

  updateCost: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const costId = form.get('costId') as string;
    const title = (form.get('title') as string)?.trim();
    const category = (form.get('category') as string)?.trim();
    const amount = parseFloat(form.get('amount') as string);
    const status = (form.get('status') as string);
    const notes = (form.get('notes') as string)?.trim() || null;

    if (!costId) return fail(400, { error: 'Cost ID is required' });
    if (!title) return fail(400, { error: 'Title is required' });
    if (isNaN(amount) || amount < 0) return fail(400, { error: 'Amount must be a positive number' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });

        await db.update(listingCosts)
          .set({
            title,
            category: category || 'Uncategorized',
            amount,
            status: status as 'estimated' | 'quoted' | 'committed' | 'paid',
            notes,
            updatedAt: new Date(),
          })
          .where(eq(listingCosts.id, costId));

        if (member) {
          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId: member.teamId,
            listingId: params.id,
            type: 'system',
            authorName: member.name,
            authorInitials: member.initials ?? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            content: `Cost updated: ${title} — $${amount.toLocaleString()}`,
            timestamp: new Date(),
          });
        }
      });
      return { success: true };
    } catch (err) {
      console.error('updateCost error:', err);
      return fail(500, { error: 'Failed to update cost' });
    }
  },

  deleteCost: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const costId = form.get('costId') as string;

    if (!costId) return fail(400, { error: 'Cost ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const cost = await db.query.listingCosts.findFirst({
          where: eq(listingCosts.id, costId),
        });

        await db.delete(listingCosts).where(eq(listingCosts.id, costId));

        if (cost) {
          const member = await db.query.teamMembers.findFirst({
            where: eq(teamMembers.userId, locals.user!.id),
          });
          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId: cost.teamId,
            listingId: params.id,
            type: 'system',
            authorName: member?.name ?? 'System',
            authorInitials: member?.initials ?? 'HT',
            content: `Cost deleted: ${cost.title}`,
            timestamp: new Date(),
          });
        }
      });
      return { success: true };
    } catch (err) {
      console.error('deleteCost error:', err);
      return fail(500, { error: 'Failed to delete cost' });
    }
  },

  approveQuote: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const quoteId = form.get('quoteId') as string;

    if (!quoteId) return fail(400, { error: 'Quote ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        const quote = await db.query.quotes.findFirst({
          where: and(eq(quotes.id, quoteId), eq(quotes.teamId, member.teamId)),
          with: { vendor: true, lineItems: true },
        });
        if (!quote) throw new Error('Quote not found');

        await db
          .update(quotes)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, member.teamId)));

        const amount = quote.amount ?? quote.lineItems.reduce((s, li) => s + (li.amount ?? 0), 0);
        await db.insert(listingCosts).values({
          teamId: member.teamId,
          listingId: params.id,
          quoteId: quote.id,
          vendorId: quote.vendorId,
          title: quote.scope ?? 'Approved quote',
          category: quote.vendor?.category ?? 'improvements',
          amount,
          status: 'committed',
          notes: quote.notes,
        });
      });
      return { success: true };
    } catch (err) {
      console.error('approveQuote error:', err);
      return fail(500, { error: 'Failed to approve quote' });
    }
  },

  declineQuote: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const quoteId = form.get('quoteId') as string;

    if (!quoteId) return fail(400, { error: 'Quote ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db
          .update(quotes)
          .set({ status: 'declined', updatedAt: new Date() })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, member.teamId)));

        const existingCost = await db.query.listingCosts.findFirst({
          where: and(eq(listingCosts.quoteId, quoteId), eq(listingCosts.teamId, member.teamId)),
        });
        if (existingCost) {
          await db.delete(listingCosts).where(eq(listingCosts.id, existingCost.id));
        }
      });
      return { success: true };
    } catch (err) {
      console.error('declineQuote error:', err);
      return fail(500, { error: 'Failed to decline quote' });
    }
  },
};

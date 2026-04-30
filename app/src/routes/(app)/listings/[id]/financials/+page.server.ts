import type { PageServerLoad, Actions } from './$types';
import { getFinancialsByListing, getQuotesByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { financialBudgets, financialCategories, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { financial: null, quotes: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [financial, quotes] = await Promise.all([
        getFinancialsByListing(team.id, params.id, db),
        getQuotesByListing(team.id, params.id, db),
      ]);
      return { financial: financial ?? null, quotes };
    });
  } catch {
    return { financial: null, quotes: [] };
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
          // Use the updated actual for this category
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
};

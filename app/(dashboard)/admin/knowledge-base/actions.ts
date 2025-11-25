'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { knowledgeBaseDocs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { addDocumentToKnowledgeBase } from '@/lib/knowledge-base';

export async function createKnowledgeBaseDoc(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const contentType = formData.get('contentType') as string;
    const category = formData.get('category') as string || undefined;
    const tags = formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : undefined;

    // Add document with automatic chunking and embedding
    await addDocumentToKnowledgeBase(orgId, title, content, contentType, {
      category,
      tags,
    });

    revalidatePath('/admin/knowledge-base');
    return { success: true };
  } catch (error) {
    console.error('Error creating knowledge base document:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create document' };
  }
}

export async function deleteKnowledgeBaseDoc(id: string) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    await db
      .delete(knowledgeBaseDocs)
      .where(and(eq(knowledgeBaseDocs.id, id), eq(knowledgeBaseDocs.orgId, orgId)));

    revalidatePath('/admin/knowledge-base');
    return { success: true };
  } catch (error) {
    console.error('Error deleting knowledge base document:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete document' };
  }
}

export async function toggleDocumentActive(id: string, isActive: boolean) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    await db
      .update(knowledgeBaseDocs)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(knowledgeBaseDocs.id, id), eq(knowledgeBaseDocs.orgId, orgId)));

    revalidatePath('/admin/knowledge-base');
    return { success: true };
  } catch (error) {
    console.error('Error toggling document:', error);
    return { error: error instanceof Error ? error.message : 'Failed to toggle document' };
  }
}

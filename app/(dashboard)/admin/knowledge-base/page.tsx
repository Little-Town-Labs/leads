import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { knowledgeBaseDocs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { KnowledgeBaseList } from './knowledge-base-list';
import { AddDocumentButton } from './add-document-button';
import { BookOpen } from 'lucide-react';

export default async function KnowledgeBaseAdminPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return <div>No organization found</div>;
  }

  // Fetch knowledge base documents
  const documents = await db
    .select()
    .from(knowledgeBaseDocs)
    .where(eq(knowledgeBaseDocs.orgId, orgId))
    .orderBy(desc(knowledgeBaseDocs.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage documents for AI-powered semantic search
          </p>
        </div>
        <AddDocumentButton />
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add documents to help the AI research agent answer questions about your business
          </p>
          <div className="mt-6">
            <AddDocumentButton />
          </div>
        </div>
      ) : (
        <KnowledgeBaseList documents={documents} />
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How It Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Documents are automatically split into chunks and embedded using OpenAI</li>
          <li>• AI agent searches for relevant chunks using semantic similarity</li>
          <li>• Top 3 most relevant chunks are included in research reports</li>
          <li>• Use this for FAQs, product docs, company info, pricing, etc.</li>
        </ul>
      </div>
    </div>
  );
}

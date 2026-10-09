import CheckinForm from '@/components/CheckinForm';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: work } = await supabase
    .from('works')
    .select('id, title, status')
    .eq('id', id)
    .single();

  if (!work) {
    notFound();
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <Link href={`/works/${id}`} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to {work.title}
      </Link>
      <CheckinForm workId={work.id} workTitle={work.title} />
    </div>
  );
}

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
    <div className="max-w-md mx-auto py-10 px-5">
      <Link
        href={`/works/${id}`}
        className="nav-link text-[13px] mb-6 inline-block"
      >
        ← Back to work details
      </Link>
      <CheckinForm workId={work.id} workTitle={work.title} />
    </div>
  );
}

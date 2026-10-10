import { createServerClient } from '@/lib/supabase/server';
import NewWorkForm from '@/components/NewWorkForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewWorkPage() {
  const supabase = await createServerClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/dept');
  }

  // Fetch segments for picker
  const { data: segments } = await supabase
    .from('segments')
    .select('id, name, ward')
    .order('name');

  // Fetch all departments
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name');

  const dept = departments?.[0];

  return (
    <NewWorkForm
      segments={segments || []}
      departmentId={dept?.id || ''}
      departmentName={dept?.name || 'Department'}
      authToken=""
    />
  );
}

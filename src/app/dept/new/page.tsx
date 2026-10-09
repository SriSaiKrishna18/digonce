import { createServerClient } from '@/lib/supabase/server';
import NewWorkForm from '@/components/NewWorkForm';

export const dynamic = 'force-dynamic';

export default async function NewWorkPage() {
  const supabase = createServerClient();

  // Fetch all segments for the segment picker
  const { data: segments } = await supabase
    .from('segments')
    .select('id, name, ward')
    .order('name');

  // For the demo, we use a hardcoded department ID
  // In production, this would come from the authenticated user's profile
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .limit(1);

  const dept = departments?.[0];

  return (
    <NewWorkForm
      segments={segments || []}
      departmentId={dept?.id || ''}
      departmentName={dept?.name || 'Demo Department'}
      authToken="" // Will be set client-side after demo login
    />
  );
}

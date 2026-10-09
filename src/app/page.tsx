import { createServerClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerClient();
  
  const { data: segmentsData } = await supabase.from('segments').select('id, name, ward, geometry');
  
  const { data: worksData } = await supabase
    .from('works')
    .select(`
      id, title, status, type, start_date, end_date,
      departments ( name ),
      work_segments ( segment_id )
    `);
    
  // Process data for HomeClient
  const segments = {
    type: 'FeatureCollection',
    features: (segmentsData || []).map((seg: any) => ({
      type: 'Feature',
      geometry: seg.geometry,
      properties: {
        id: seg.id,
        name: seg.name,
        ward: seg.ward
      }
    }))
  };

  const works = (worksData || []).map((w: any) => ({
    id: w.id,
    title: w.title,
    status: w.status,
    type: w.type,
    department_name: w.departments?.name,
    segment_ids: w.work_segments?.map((ws: any) => ws.segment_id) || [],
    start_date: w.start_date,
    end_date: w.end_date
  }));

  return <HomeClient segments={segments} works={works} />;
}

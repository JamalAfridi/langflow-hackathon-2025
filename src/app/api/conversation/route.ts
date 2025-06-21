
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  const { transcript } = await req.json() as {
      transcript: { role: 'user' | 'ai'; message: string }[];
  }

  const supabase = await createClient();

  const cookieStore = await cookies();
  console.log('Available cookies:', cookieStore.getAll());

  let  { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log('Auth error:', authError);
  console.log('User:', user);
  console.log('User ID:', user?.id);

  if (authError || !user) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: headerUser }, error: headerError } = await supabase.auth.getUser(token);
      user = headerUser;
      authError = headerError;
    }
  }

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summaryText = transcript
  .map(t => 
    // use backticks around the whole string so ${…} works
    `${t.role === 'user' ? 'Child' : 'Dr Wobble'}: ${t.message}`
  )
  .join('\n');


  console.log(summaryText);

  const { error } = await supabase.from('conversations').insert({
      user_id: user?.id,
      summary: summaryText,
      
  });

  if (error) {
      console.error('Error saving conversation:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return NextResponse.json({ stored: true });
}

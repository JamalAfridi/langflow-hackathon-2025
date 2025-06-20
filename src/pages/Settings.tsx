
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Phone, Baby } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  child_name: string;
  child_age: number;
  caregiver_phone: string;
}

interface Conversation {
  id: string;
  child_name: string;
  child_age: number;
  symptoms: string[];
  summary: string;
  sent_to: string;
  created_at: string;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchConversations();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          child_name: profile.child_name,
          child_age: profile.child_age,
          caregiver_phone: profile.caregiver_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-xl text-purple-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-purple-600"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-purple-800">User Settings</h2>
          </div>

          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
              />
            </div>

            <div>
              <Label htmlFor="childName">Child's Name</Label>
              <Input
                id="childName"
                type="text"
                value={profile?.child_name || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, child_name: e.target.value} : null)}
              />
            </div>

            <div>
              <Label htmlFor="childAge">Child's Age</Label>
              <Input
                id="childAge"
                type="number"
                value={profile?.child_age || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, child_age: parseInt(e.target.value)} : null)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Caregiver Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile?.caregiver_phone || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, caregiver_phone: e.target.value} : null)}
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-12 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white rounded-2xl font-bold"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* Conversation History */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <Baby className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-purple-800">Past Conversations</h2>
          </div>

          {conversations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No conversations yet. Start chatting with ToonDoc!</p>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="bg-purple-50 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {conversation.child_name || 'Anonymous'} ({conversation.child_age} years)
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {conversation.symptoms && conversation.symptoms.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">
                        <strong>Symptoms:</strong> {conversation.symptoms.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {conversation.summary && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">
                        <strong>Summary:</strong> {conversation.summary}
                      </p>
                    </div>
                  )}
                  
                  {conversation.sent_to && (
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Sent to:</strong> {conversation.sent_to}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

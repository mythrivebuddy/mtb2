'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
 
  MessageSquare, 
  Instagram, 
  Send, 
  Twitter, 
  Linkedin,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalRewards: number;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    joinedAt: string;
    rewardEarned: number;
  }>;
}

async function fetchReferralStats(): Promise<ReferralStats> {
  try {
    const response = await axios.get('/api/refer-friend');
    console.log('response',response);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch referral stats');
    }
    throw new Error('Failed to fetch referral stats');
  }
}

async function sendEmailInvitation(email: string) {
  try {
    const response = await axios.post('/api/refer-friend', { email });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to send invitation');
    }
    throw new Error('Failed to send invitation');
  }
}

export default function ReferFriendPage() {
  const [email, setEmail] = useState('');
  const [isCopied, setIsCopied] = useState<{ code: boolean; link: boolean }>({ code: false, link: false });

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: fetchReferralStats,
  });

  const sendEmailMutation = useMutation({
    mutationFn: sendEmailInvitation,
    onSuccess: () => {
      toast.success('Invitation sent successfully!');
      setEmail('');
      refetch(); // Refresh stats after successful referral
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const referralUrl = stats ? `${window.location.origin}/signup?ref=${stats.referralCode}` : '';

  const handleCopy = (type: 'code' | 'link') => {
    const textToCopy = type === 'code' ? stats?.referralCode : referralUrl;

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied({ ...isCopied, [type]: true });
      toast.success(`${type === 'code' ? 'Referral code' : 'Referral link'} copied!`);
      setTimeout(() => setIsCopied({ ...isCopied, [type]: false }), 2000);
    }
  };

  const handleShare = (platform: string) => {
    const shareText = `Join me on MyThriveBuddy! Use my referral code: ${stats?.referralCode} or click here: ${referralUrl}`;
    
    const platforms = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
    };

    window.open(platforms[platform as keyof typeof platforms]);
  };

  const handleEmailReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    sendEmailMutation.mutate(email);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{(error as Error)?.message}</p>
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Refer a Friend</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Rewards</p>
                <p className="text-2xl font-bold">{stats?.totalRewards || 0} JP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {stats?.referralCode}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy('code')}
                className="flex items-center space-x-2"
              >
                {isCopied.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{isCopied.code ? 'Copied!' : 'Copy Code'}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={referralUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy('link')}
                className="flex items-center space-x-2"
              >
                {isCopied.link ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{isCopied.link ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share Via</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {['whatsapp', 'telegram', 'twitter', 'linkedin'].map((platform) => (
                <Button
                  key={platform}
                  variant="outline"
                  onClick={() => handleShare(platform)}
                  className="flex items-center space-x-2"
                >
                  {platform === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                  {platform === 'telegram' && <Instagram className="h-4 w-4" />}
                  {platform === 'twitter' && <Twitter className="h-4 w-4" />}
                  {platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
                  <span>Share on {platform}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite via Email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailReferral}>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="mt-4" disabled={sendEmailMutation.isPending}>
                {sendEmailMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                Send Invitation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

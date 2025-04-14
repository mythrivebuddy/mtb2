

'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Github, Linkedin, Twitter, Instagram, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserData {
  name: string;
  email: string;
  image: string | null;
  keyOfferings: string | null;
  achievements: string | null;
  socialHandles: {
    github: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  goals: string | null;
  website: string | null;
  jpEarned: number;
  jpSpent: number;
  jpBalance: number;
  jpTransaction: number;
}

async function fetchUser(userId: string): Promise<UserData> {
  const res = await fetch(`/api/user/${userId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch user data');
  }
  return res.json();
}

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const {
    data: userData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId, // only run when userId is available
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{(error as Error)?.message}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-white/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData.image || undefined} />
                <AvatarFallback>
                  {userData.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold">{userData.name}</CardTitle>
                <p className="text-gray-600 mt-1">{userData.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">JP Balance: {userData.jpBalance}</Badge>
                  <Badge variant="outline">JP Earned: {userData.jpEarned}</Badge>
                  <Badge variant="outline">JP Spent: {userData.jpSpent}</Badge>
                  <Badge variant="outline">JP Transaction: {userData.jpTransaction}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {userData.website && (
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-gray-500" />
                <a
                  href={userData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {userData.website}
                </a>
              </div>
            )}

            <div className="flex space-x-4">
              {userData.socialHandles.github && (
                <a href={userData.socialHandles.github} target="_blank" rel="noreferrer">
                  <Github className="h-6 w-6 text-gray-700 hover:text-gray-900" />
                </a>
              )}
              {userData.socialHandles.twitter && (
                <a href={userData.socialHandles.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-6 w-6 text-blue-400 hover:text-blue-600" />
                </a>
              )}
              {userData.socialHandles.linkedin && (
                <a href={userData.socialHandles.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-6 w-6 text-blue-700 hover:text-blue-900" />
                </a>
              )}
              {userData.socialHandles.instagram && (
                <a href={userData.socialHandles.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-6 w-6 text-pink-500 hover:text-pink-700" />
                </a>
              )}
            </div>

            {userData.keyOfferings && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Offerings</h3>
                <p className="text-gray-600">{userData.keyOfferings}</p>
              </div>
            )}

            {userData.achievements && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Achievements</h3>
                <p className="text-gray-600">{userData.achievements}</p>
              </div>
            )}

            {userData.goals && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Goals</h3>
                <p className="text-gray-600">{userData.goals}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

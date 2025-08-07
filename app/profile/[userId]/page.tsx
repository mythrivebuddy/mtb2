"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PageSkeleton from "@/components/PageSkeleton";
import {
  ArrowLeft,
  Link,
  Share2,
  Facebook,
  X,
  Linkedin,
  Instagram,
  Youtube,
  Globe,
  Briefcase,
  Award,
  Target,
  Star,
  FileText,
  Sun,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TikTokIcon from "@/components/icons/TiktokIcon";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface UserData {
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  keyOfferings: string | null;
  achievements: string | null;
  missionStatement: string | null;
  featuredWorkTitle: string | null;
  featuredWorkDesc: string | null;
  socialHandles: {
    facebook: string;
    x: string;
    linkedin: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };
  goals: string | null;
  website: string | null;
  jpEarned: number;
  jpSpent: number;
  jpBalance: number;
  jpTransaction: number;
  dailyBloomsAdded?: number;
  dailyBloomsCompleted?: number;
  miracleLogsCreated?: number;
  challengesCreated?: number;
  challengesJoined?: number;
  challengesCompleted?: number;
}

async function fetchUser(userId: string): Promise<UserData> {
  const res = await fetch(`/api/profile/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch user data");
  }
  return res.json();
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  const maskedLocalPart =
    localPart[0] + "*****" + localPart[localPart.length - 1];
  return maskedLocalPart + "@" + domain;
}

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (session?.user?.id && userId !== session.user.id) {
      timeoutId = setTimeout(() => {
        axios
          .post("/api/user/insights/profile-views", {
            userId,
            viewerId: session.user.id,
          })
          .catch(console.error);
      }, 500);
    }

    return () => clearTimeout(timeoutId);
  }, [userId, session?.user?.id]);

  const {
    data: userData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });

  const profileUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/profile/${userId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  if (isLoading) {
    return <PageSkeleton type=" user-profile" />;
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100">
          <h2 className="text-3xl font-bold text-rose-600 mb-4 text-center">
            Oops, Something Went Wrong
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            {(error as Error)?.message}
          </p>
          <Button
            onClick={() => router.back()}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* --- BACK TO HOME BUTTON --- */}
        <div className="mb-4">
            <Button variant="outline" onClick={() => router.push('/')} className="flex items-center gap-2 bg-white/50 hover:bg-white/90">
                <ArrowLeft size={16} />
                Back to Home
            </Button>
        </div>
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-48 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <div className="relative px-8 pb-20">
            <div className="absolute -top-24 left-8">
              <Avatar className="h-48 w-48 border-6 border-white shadow-xl rounded-full transform hover:scale-105 transition-transform duration-300">
                <AvatarImage src={userData.image || undefined} />
                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700">
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute top-2 mt-12 right-4 pr-10"> 
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2 px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <Share2 className="h-5 w-5" />
                      Share Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-white/95 backdrop-blur-md shadow-xl rounded-lg p-2 border border-gray-100"
                  >
                    <DropdownMenuItem asChild>
                      <button
                        onClick={handleCopyLink}
                        className="w-full h-11 flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-md transition-all duration-200"
                      >
                        <Link className="h-5 w-5 text-blue-600" />
                        Copy Profile Link
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://twitter.com/intent/tweet?text=Check out this profile: ${profileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full h-11 flex items-center gap-3 bg-gray-800 hover:bg-gray-900 text-white rounded-md transition-all duration-200">
                          <X className="h-5 w-5" />
                          Share on X
                        </Button>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://wa.me/?text=Check out this profile: ${profileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full h-11 flex items-center gap-3 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-md transition-all duration-200">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Share on WhatsApp
                        </Button>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://t.me/share/url?url=Check out this profile: ${profileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full h-11 flex items-center gap-3 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-md transition-all duration-200">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.563 8.994l-1.83 8.59c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.566-4.458c.534-.196 1.006.128.832.941z" />
                          </svg>
                          Share on Telegram
                        </Button>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu></div>
            <CardHeader className="pt-28">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-3">
                  <h1 className="text-5xl font-bold text-gray-800 tracking-tight bg-clip-text pb-2text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    {userData.name}
                  </h1>
                  {userData.bio && (
                    <p className="text-gray-600">{userData.bio}</p>
                  )}
                  <p className="text-gray-500 text-sm font-medium">
                    {maskEmail(userData.email)}
                  </p>
                </div>
                {/* --- SHARE PROFILE BUTTON --- */}
             
              </div>
            </CardHeader>
            <CardContent className="space-y-12">
              <div className="flex flex-wrap items-center gap-6">
                {userData.website && (
                  <a
                    href={userData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2 px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <Globe className="h-5 w-5" />
                      Visit Website
                    </Button>
                  </a>
                )}
                <div className="flex gap-4">
                  {userData.socialHandles.facebook && (
                    <a
                      href={userData.socialHandles.facebook}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="p-3 rounded-full border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <Facebook className="h-6 w-6 text-blue-600" />
                      </Button>
                    </a>
                  )}
                  {userData.socialHandles.x && (
                    <a
                      href={userData.socialHandles.x}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="p-3 rounded-full border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <X className="h-6 w-6 text-gray-800" />
                      </Button>
                    </a>
                  )}
                  {userData.socialHandles.linkedin && (
                    <a
                      href={userData.socialHandles.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="p-3 rounded-full border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <Linkedin className="h-6 w-6 text-blue-700" />
                      </Button>
                    </a>
                  )}
                  {userData.socialHandles.youtube && (
                    <a
                      href={userData.socialHandles.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="p-3 rounded-full border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <Youtube className="h-6 w-6 text-red-600" />
                      </Button>
                    </a>
                  )}
                  {userData.socialHandles.tiktok && (
                    <a
                      href={userData.socialHandles.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="p-3 rounded-full border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <TikTokIcon className="h-6 w-6 text-black" />
                      </Button>
                    </a>
                  )}
                  {userData.socialHandles.instagram && (
                    <a
                      href={userData.socialHandles.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="p-3 rounded-full border-gray-200 bg-white/50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <Instagram className="h-6 w-6 text-pink-500" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Badge className="py-3 md:px-6 text-sm bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex-wrap">
                  <span className="font-semibold">Balance:</span>{" "}
                  {userData.jpBalance} JP
                </Badge>
                <Badge className="py-3 md:px-6 text-sm bg-gradient-to-r from-green-100 to-teal-100 text-green-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex-wrap">
                  <span className="font-semibold">Earned:</span>{" "}
                  {userData.jpEarned} JP
                </Badge>
                <Badge className="py-3 md:px-6 text-sm bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex-wrap">
                  <span className="font-semibold">Spent:</span> {userData.jpSpent}{" "}
                  JP
                </Badge>
                <Badge className="py-3 md:px-6 text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex-wrap">
                  <span className="font-semibold">Transactions:</span>{" "}
                  {userData.jpTransaction}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="p-4 flex flex-col items-center justify-center text-center cursor-pointer rounded-lg border bg-gradient-to-r from-green-50 to-lime-50 hover:shadow-xl transition-all duration-300">
                      <Sun className="h-8 w-8 text-green-600 mb-2" />
                      <h4 className="font-semibold text-lg text-gray-800">
                        Daily Blooms
                      </h4>
                      <p className="text-xs text-gray-500">Hover for stats</p>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          Daily Blooms Status
                        </h4>
                        <p className="text-sm">
                          Total Added:{" "}
                          <span className="font-bold text-green-700">
                            {userData.dailyBloomsAdded ?? 0}
                          </span>
                        </p>
                        <p className="text-sm">
                          Total Completed:{" "}
                          <span className="font-bold text-green-700">
                            {userData.dailyBloomsCompleted ?? 0}
                          </span>
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="p-4 flex flex-col items-center justify-center text-center cursor-pointer rounded-lg border bg-gradient-to-r from-yellow-50 to-amber-50 hover:shadow-xl transition-all duration-300">
                      <Sparkles className="h-8 w-8 text-yellow-500 mb-2" />
                      <h4 className="font-semibold text-lg text-gray-800">
                        Miracle Log
                      </h4>
                      <p className="text-xs text-gray-500">Hover for stats</p>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          Miracle Log Status
                        </h4>
                        <p className="text-sm">
                          Total Created:{" "}
                          <span className="font-bold text-amber-700">
                            {userData.miracleLogsCreated ?? 0}
                          </span>
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="p-4 flex flex-col items-center justify-center text-center cursor-pointer rounded-lg border bg-gradient-to-r from-red-50 to-orange-50 hover:shadow-xl transition-all duration-300">
                      <Trophy className="h-8 w-8 text-red-500 mb-2" />
                      <h4 className="font-semibold text-lg text-gray-800">
                        Challenges
                      </h4>
                      <p className="text-xs text-gray-500">Hover for stats</p>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          Challenges Status
                        </h4>
                        <p className="text-sm">
                          Created:{" "}
                          <span className="font-bold text-red-700">
                            {userData.challengesCreated ?? 0}  
                          </span>
                        </p>
                        <p className="text-sm">
                          Joined:{" "}
                          <span className="font-bold text-red-700">
                            {userData.challengesJoined ?? 0}
                          </span>
                        </p>
                        <p className="text-sm">
                          Completed:{" "}
                          <span className="font-bold text-red-700">
                            {userData.challengesCompleted ?? 0}
                             
                          </span>
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {userData.keyOfferings && (
                  <Card className="bg-white/50 backdrop-blur-md shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        Key Offerings
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {userData.keyOfferings}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {userData.achievements && (
                  <Card className="bg-white/50 backdrop-blur-md shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        Achievements
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {userData.achievements}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {userData.missionStatement && (
                  <Card className="bg-white/50 backdrop-blur-md shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Missions
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {userData.missionStatement}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {userData.goals && (
                  <Card className="bg-white/50 backdrop-blur-md shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Star className="h-5 w-5 text-blue-600" />
                        Goals
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {userData.goals}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {userData.featuredWorkTitle && (
                  <Card className="bg-white/50 backdrop-blur-md shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Featured Work Title
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {userData.featuredWorkTitle}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {userData.featuredWorkDesc && (
                  <Card className="bg-white/50 backdrop-blur-md shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Featured Work Description
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {userData.featuredWorkDesc}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
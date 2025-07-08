Toheed i have doing changes for implementing which user is online or not 
there is two hook for that one for toggling the isOnline field in user schema so when user comes on our site their isOnline set to be true and user connect withs supabase channel for realtime which is useUserPresence which 
and another hook is useUserRealtime which extracts the online users id from the supabase channel and update a state of onlinUsers.

working on files userUserPresence.ts,useRealtime.ts,data-table.tsx,leaderboard-client.tsx,UserInfo.tsx and (userDashboard)/dashboard/page.tsx.

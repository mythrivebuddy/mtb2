import { Group } from "@/app/(userDashboard)/dashboard/accountability/home/page";
import Link from "next/link";


interface GroupCardProps {
  group: Group;
}

const timeAgo = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

export function GroupCard({ group }: GroupCardProps) {
    const displayMembers = group.members.slice(0, 3);
    const remainingMembers = group.members.length - displayMembers.length;

    return (
        <Link href={`/dashboard/accountability?groupId=${group.id}`} passHref legacyBehavior>
            <a className="block bg-white p-4 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-400 border border-transparent transition-all duration-300 cursor-pointer transform hover:scale-[1.02]">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex -space-x-3 items-center flex-shrink-0">
                            {displayMembers.map((member, index) => (
                                <img
                                    key={member.user.id}
                                    className="h-10 w-10 rounded-full object-cover border-2 border-white"
                                    src={member.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=random&color=fff`}
                                    alt={member.user.name}
                                    title={member.user.name}
                                    style={{ zIndex: 10 - index }}
                                />
                            ))}
                            {remainingMembers > 0 && (
                                <div className="h-10 w-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white" style={{ zIndex: 0 }}>
                                    +{remainingMembers}
                                </div>
                            )}
                        </div>
                        
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                            <p className="text-sm text-gray-500">
                                Active {timeAgo(group.updatedAt)}
                            </p>
                        </div>
                    </div>
                    
                    {/* Styled this like the 'KM' in your figma design */}
                    <div className="flex-shrink-0 text-right">
                         <span className="text-lg font-bold text-blue-600 whitespace-nowrap">
                            {group.members.length}
                         </span>
                         <p className="text-xs text-gray-500 -mt-1">{group.members.length === 1 ? 'Member' : 'Members'}</p>
                    </div>
                </div>
            </a>
        </Link>
    );
}
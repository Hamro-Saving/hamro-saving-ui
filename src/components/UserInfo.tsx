interface UserInfoProps {
  name: string;
  email: string;
  avatar: string;
}

export default function UserInfo({ name, email, avatar }: UserInfoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col text-right order-1">
        <span className="font-medium text-gray-900 text-sm leading-tight">{name}</span>
        <span className="text-xs text-gray-500">{email}</span>
      </div>
      <img
        src={avatar}
        alt={name}
        className="w-9 h-9 rounded-full border border-blue-200 shadow-sm order-2"
      />
    </div>
  );
}

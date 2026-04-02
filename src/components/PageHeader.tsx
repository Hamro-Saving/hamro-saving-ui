import { useAuth } from '../context/AuthContext';

interface PageHeaderProps {
  title?: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      {title && <h1 className="text-lg font-semibold text-gray-800">{title}</h1>}
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
      </div>
    </header>
  );
}

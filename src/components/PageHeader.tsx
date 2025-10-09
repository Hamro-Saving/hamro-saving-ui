import UserInfo from "./UserInfo";
import { currentUser } from "../data/currentUser";

export default function PageHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="mt-2 text-xl font-semibold text-gray-900">{title}</h1>
      <UserInfo name={currentUser.name} email={currentUser.email} avatar={currentUser.avatar} />
    </div>
  );
}

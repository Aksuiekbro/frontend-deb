import ProfileClient from "./ProfileClient";

type ProfilePageProps = { params: Promise<{ id: string }> };

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id: userId } = await params;

  return <ProfileClient userId={Number(userId)} />;
}

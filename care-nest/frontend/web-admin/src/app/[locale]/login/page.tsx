import { redirect } from 'next/navigation';

export default function LoginRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale || 'vi'}/auth/login`);
}

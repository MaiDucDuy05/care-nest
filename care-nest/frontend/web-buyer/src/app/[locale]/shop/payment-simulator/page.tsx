import { redirect } from 'next/navigation';

export default function PaymentSimulatorRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale || 'vi'}/shop/cart`);
}

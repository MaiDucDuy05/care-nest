import { redirect } from 'next/navigation';

export default function CheckoutRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/shop/cart`);
}


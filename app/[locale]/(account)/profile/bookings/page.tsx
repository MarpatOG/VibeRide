import {redirect} from 'next/navigation';

export default function ProfileBookingsRedirectPage() {
  redirect('/profile#my-bookings');
}

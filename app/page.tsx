'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  useEffect(() => {
    signIn();
  }, []);

  return (
    <div>
      <p>Redirecting to sign in...</p>
    </div>
  );
}
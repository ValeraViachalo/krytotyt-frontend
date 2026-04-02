import React from 'react'

import "./NotFound.scss";
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <Image
        src="/assets/404-page.svg"
        width={567}
        height={190}
        alt="404 - Page Not Found"
        className="not-found-page__image"
      />
      <p>На жаль, сторінку не знайдено</p>
      <Link href="/" className="button not-found-page__link">
        на головну
      </Link>
    </main>
  )
}

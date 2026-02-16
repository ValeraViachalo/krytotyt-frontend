import React from 'react'
import { Logo } from '../Logo/Logo';

import './Header.scss';


export default function Header() {
  return (
    <header className="header">
      <Logo className="header__logo" />
    </header>
  );
}

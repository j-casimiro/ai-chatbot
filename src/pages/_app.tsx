import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/theme-provider';
import '@/styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="light" forcedTheme="light">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

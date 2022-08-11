import { NextPage } from 'next'
import Head from 'next/head'
import { ReactNode } from 'react'
import ThemeSwitch from './ThemeSwitch'
interface layoutProps {
  children: ReactNode
}

const Layout: NextPage<layoutProps> = ({ children }) => {
  return (
    <main
      className="
      bg-zinc-300 
      text-zinc-700
      dark:bg-zinc-900
      dark:text-zinc-400
      min-h-screen min-w-full
      flex flex-col items-center justify-between
      overflow-hidden
      max-h-screen
      "
    >
      <Head>
        <title>CryptoDevDAO</title>
        <meta name="description" content="CryptoDevDAO from LearnWeb3" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section
        className="
        min-w-full
        flex justify-end
        p-5"
      >
        <ThemeSwitch />
      </section>

      <section className="flex md:items-center items-start justify-center grow min-w-full">
        {children}
      </section>
    </main>
  )
}

export default Layout

import React from 'react'

const Header = ({walletBalance}) => {
  return (
    <header className='fixed top-0 left-0 bg-blue-800 w-full h-14'>
        <div className='flex flex-col lg:flex-row w-full h-full justify-center items-center space-x-2'>
                <h1 className='text-2xl font-extrabold'>FMI-Freelancing</h1>
                <h2 className='absolute right-12 text-xl'> {typeof(walletBalance) !== 'number' && `Balanta: ${walletBalance} ETH`} </h2>
        </div>
    </header>
  )
}

export default Header
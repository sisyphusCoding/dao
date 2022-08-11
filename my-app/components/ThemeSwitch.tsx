
import{motion} from 'framer-motion'
import { win32 } from 'path'
import { useEffect, useState } from 'react'
import{BsMoonFill, BsSunFill} from 'react-icons/bs'
const ThemeSwitch = () =>{
  const [dark , setDark] = useState(false)

  useEffect(()=>{ 
    if(
      localStorage.theme ==='dark' ||
      (!('theme' in localStorage) &&
      window.matchMedia('(prefers-color-scheme:dark)').matches)){
      setDark(true)
    }
  },[])

      
  useEffect(()=>{
      if(dark){
      document.documentElement.classList.add('dark')
      localStorage.theme='dark'  
    }else{
      document.documentElement.classList.remove('dark')
      localStorage.theme='light'  
    }
  },[dark])

  return(
    <motion.div
      onClick={()=>{setDark(!dark)}}
      animate={{rotateX: dark? 180:0}}
      transition={{type:'spring',damping:7.5,stiffness:90}}
      style={{transformStyle:'preserve-3d'}}
      className="
      cursor-pointer
      bg-zinc-100
      dark:bg-zinc-600
      rounded-[1.75vmin]
      md:h-[5.5vmin] md:w-[5.5vmin]
      h-[7vmin] w-[7vmin]
      relative
      flex items-center justify-center
      md:text-3xl
      text-2xl
      "
      >
      <div 
        style={{
          transform:'rotateX(0) translate3d(0,0,.8rem)'
        }}
       className='absolute'
       >
          <BsSunFill/>
      </div>
        <div  
        style={{
          transform:'rotateX(180deg) translate3d(0,0,.8rem)'
        }}
          >
          <BsMoonFill/>
      </div>

    </motion.div>
  )
}


export default ThemeSwitch

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import logo from '../assets/logo-youon.svg';

export default function IntroStage() {
  const controls = useAnimation();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const sequence = async () => {
      // 1. Começa centralizada
      await controls.start({ x: 0, rotate: 0, opacity: 1 });

      // 2. Gira devagar e rola pra direita
      await controls.start({
        x: "100vw",
        rotate: 90,
        opacity: 0,
        transition: { duration: 1.5, ease: "easeInOut" },
      });
      setStage(1); // muda pra branco

      // 3. Volta da esquerda
      await controls.start({
        x: "-100vw",
        rotate: -90,
        opacity: 0,
        transition: { duration: 0 },
      });
      setStage(2); // muda pra verde

      await controls.start({
        x: 0,
        rotate: 0,
        opacity: 1,
        transition: { duration: 1.5, ease: "easeInOut" },
      });

      // 4. Gira e desaparece
      await controls.start({
        rotate: 360,
        scale: 0,
        opacity: 0,
        transition: { duration: 1.2, ease: "easeInOut" },
      });

      setStage(3);
    };

    sequence();
  }, [controls]);

  const bgClass = ["bg-black", "bg-white", "bg-green-900", "bg-green-900"][stage];

  return (
    <div className={`fixed inset-0 w-full h-full flex items-center justify-center transition-colors duration-700 ${bgClass}`}>
      {stage < 3 && (
        <motion.img
          src={logo}
          alt="Youon Logo"
          animate={controls}
          initial={{ x: 0, rotate: 0, opacity: 0, scale: 1 }}
          className="w-[120px] h-[120px] object-contain"
        />
      )}
    </div>
  );
}

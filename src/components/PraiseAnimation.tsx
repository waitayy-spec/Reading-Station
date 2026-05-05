import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "../assets/reading-stars.json";

interface Props {
  show: boolean;
  text: string;
  onDone: () => void;
}

export default function PraiseAnimation({ show, text, onDone }: Props) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2200);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="overlay">
      <div className="praise-card">
        <Lottie animationData={animationData} loop className="lottie" />
        <h3>打卡成功</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

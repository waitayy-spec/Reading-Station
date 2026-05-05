import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdater() {
  const { needRefresh, updateServiceWorker } = useRegisterSW();

  return needRefresh ? (
    <button className="pwa-update" onClick={() => updateServiceWorker(true)}>
      新版本已就绪，点击刷新
    </button>
  ) : null;
}

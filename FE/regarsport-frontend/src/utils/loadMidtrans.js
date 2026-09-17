// export const loadMidtransSnap = () => {
//   const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

//   if (!clientKey) {
//     return Promise.resolve(null);
//   }

//   if (typeof window !== "undefined" && window.snap) {
//     return Promise.resolve(window.snap);
//   }

//   return new Promise((resolve, reject) => {
//     let attempts = 0;
//     const maxAttempts = 30;

//     const waitForSnap = () => {
//       if (window.snap) {
//         resolve(window.snap);
//         return;
//       }

//       attempts += 1;

//       if (attempts >= maxAttempts) {
//         reject(new Error("Midtrans Snap belum siap"));
//         return;
//       }

//       setTimeout(waitForSnap, 100);
//     };

//     waitForSnap();
//   });
// };

export const loadMidtransSnap = () => {
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!clientKey) {
    return Promise.resolve(null);
  }

  if (typeof window !== "undefined" && window.snap) {
    return Promise.resolve(window.snap);
  }

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30;
    const timeout = setTimeout(() => {
      reject(new Error("Midtrans Snap load timeout after 3 seconds"));
    }, 3000);

    const waitForSnap = () => {
      if (window.snap) {
        clearTimeout(timeout);
        resolve(window.snap);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        clearTimeout(timeout);
        reject(new Error("Midtrans Snap tidak tersedia setelah percobaan maksimal"));
        return;
      }

      setTimeout(waitForSnap, 100);
    };

    waitForSnap();
  });
};
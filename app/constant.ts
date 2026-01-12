const listImgUrl = {
  job_code: "STWODEC30001",
  customer_code: "Mr. John Doe",
  note: "Ghi chú của đơn hàng...",
  files: [
    {
      type: "image",
      url: "https://www.dropbox.com/scl/fo/9z19shp7slnxpxfd1icr0/ANc_ymutPKyqyDJy8R2ZoJo?dl=0&e=1&preview=Order+1892+-+%5BImage+1%5D+-+003.JPG&rlkey=b5xgq28zcl3e7bcxsdotja6ue&st=c9rc7q9m",
      comment: "okay tks",
    },
    {
      type: "image",
      url: "https://www.dropbox.com/scl/fo/9z19shp7slnxpxfd1icr0/ANc_ymutPKyqyDJy8R2ZoJo?dl=0&e=1&preview=Order+1892+-+%5BImage+10%5D+-+003.JPG&rlkey=b5xgq28zcl3e7bcxsdotja6ue&st=c9rc7q9m",
      comment: "okay tks image 2",
    },
    {
      type: "image",
      url: "https://www.dropbox.com/scl/fo/9z19shp7slnxpxfd1icr0/ANc_ymutPKyqyDJy8R2ZoJo?dl=0&e=1&preview=Order+1892+-+%5BImage+11%5D+-+003.JPG&rlkey=b5xgq28zcl3e7bcxsdotja6ue&st=c9rc7q9m",
      comment: "okay tks image 3",
    },
  ],
};
export const listVideoUrl = {
  order_from: "order", /* order.fotober.com or OPS.fotober.com */
  job_code: "STWODEC30001",
  customer_code: "Mr. John Doe",
  note: "Ghi chú của đơn hàng...",
  sale_email: "sales@example.com",
  invoice_link: "https://example.com/invoice/12345",
  files: [
    {
      type: "Video",
      id: "file_001",
      url: "https://dl.dropboxusercontent.com/scl/fi/sq60uah81wboknq3aldsw/Wrap-up-2024-Vertical1.mp4?rlkey=ycksrmcsqjkz52ti6eho4qbqf&amp;st=12e6x9r0&amp;dl=0",
      name: "Wrap-up-2024-Vertical1.mp4",  /*tên file nếu có*/
      accepted: true,
      comment: "okay tks",
    },
    {
      id: "file_002",
      type: "Video",
      url: "https://dl.dropboxusercontent.com/scl/fi/sq60uah81wboknq3aldsw/Wrap-up-2024-Vertical1.mp4?rlkey=ycksrmcsqjkz52ti6eho4qbqf&amp;st=12e6x9r0&amp;dl=0",
      name: "Wrap-up-2024-Vertical1.mp4",  /*tên file nếu có*/
      accepted: false,
      comment: "okay tks video 2",
    },
    {
      id: "file_003",
      type: "Video",
      url: "https://dl.dropboxusercontent.com/scl/fi/sq60uah81wboknq3aldsw/Wrap-up-2024-Vertical1.mp4?rlkey=ycksrmcsqjkz52ti6eho4qbqf&amp;st=12e6x9r0&amp;dl=0",
      accepted: true,
      name: "Wrap-up-2024-Vertical1.mp4", /*tên file nếu có*/
      comment: "okay tks video 3",
    },
  ],
};

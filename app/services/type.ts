export interface FileItem {
order_from?: string;
  job_code?: string;
  customer_code?: string;
  note?: string;
  sale_email?: string;
  invoice_link?: string;
    files: {
      type: string;
      id: string;
      url: string;
      name?: string;
      accepted: boolean;
        comment?: string;
    }[];
}



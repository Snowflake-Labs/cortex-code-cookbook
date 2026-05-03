---
name: pdf-processor
version: "2.2"
description: "Process PDF documents using Snowflake AI_EXTRACT. Extracts structured data directly from the PDF file via a Snowflake stage. Triggers: process PDF, extract PDF, analyze PDF, summarize PDF, read PDF."
---

# PDF Processor

Extract structured data from PDF documents using Snowflake's `AI_EXTRACT` function directly on the file — no local text extraction needed.

## When to Use

Activate this skill when asked to:
- Process or extract data from a PDF document
- Summarize a PDF (invoice, report, contract, research paper)
- Analyze PDF content using Snowflake AI

## Prerequisites

- A Snowflake connection must be active (the SQL tool will use it)
- A named internal stage must be available to upload the file

## Step 1: Create a stage (if needed)

Use the SQL tool to create a temporary stage:

```sql
CREATE STAGE IF NOT EXISTS pdf_processor_stage;
```

## Step 2: Upload the PDF to the stage

Use Bash to upload the PDF via the Snowflake CLI:

```bash
snow sql -q "PUT file://<absolute_path_to_pdf> @pdf_processor_stage AUTO_COMPRESS=FALSE OVERWRITE=TRUE"
```

## Step 3: Extract structured data with AI_EXTRACT

Use the SQL tool to run `AI_EXTRACT` directly on the staged file:

```sql
SELECT AI_EXTRACT(
    file => TO_FILE('@pdf_processor_stage', '<filename.pdf>'),
    responseFormat => {
        'schema': {
            'type': 'object',
            'properties': {
                'document_type': {
                    'type': 'string',
                    'description': 'High-level document category: invoice, utility bill, contract, report, receipt, payslip, or similar. One word or short phrase only.'
                },
                'title': {
                    'type': 'string',
                    'description': 'The printed title or subject of the document (e.g. "Invoice", "Faktura AvtaleGiro"). NOT the company name or recipient name.'
                },
                'invoice_number': {
                    'type': 'string',
                    'description': 'Invoice or document reference number. Usually labeled Invoice #, Invoice no, Fakturanummer, or similar. Return null if not present.'
                },
                'invoice_date': {
                    'type': 'string',
                    'description': 'The date the document was issued (date of issue, fakturadato). Return in the format found in the document. Return null if not present.'
                },
                'due_date': {
                    'type': 'string',
                    'description': 'The payment due date or direct debit date. Return null if not present.'
                },
                'sender_name': {
                    'type': 'string',
                    'description': 'Name of the company or person who issued the document (the seller or biller). Usually labeled Seller, From, or similar.'
                },
                'sender_address': {
                    'type': 'string',
                    'description': 'Full address of the sender/seller. Return null if not present.'
                },
                'sender_tax_id': {
                    'type': 'string',
                    'description': 'Tax ID, VAT number, or org number of the sender. Return null if not present.'
                },
                'sender_iban': {
                    'type': 'string',
                    'description': 'IBAN or bank account number of the sender for payment. Return null if not present.'
                },
                'recipient_name': {
                    'type': 'string',
                    'description': 'Full name of the person or company the document is addressed to (client, buyer). NOT the sender.'
                },
                'recipient_address': {
                    'type': 'string',
                    'description': 'Full address of the recipient/client. Return null if not present.'
                },
                'recipient_tax_id': {
                    'type': 'string',
                    'description': 'Tax ID or VAT number of the recipient/client. Return null if not present.'
                },
                'line_items': {
                    'type': 'object',
                    'description': 'Individual charge or product rows from the ITEMS or line items table. Each array entry is one row.',
                    'column_ordering': ['description', 'quantity', 'unit', 'net_price', 'net_worth', 'vat_rate', 'gross_worth'],
                    'properties': {
                        'description': {
                            'type': 'array',
                            'description': 'Full description or name of each line item product or service.'
                        },
                        'quantity': {
                            'type': 'array',
                            'description': 'Quantity for each line item. Return null if not shown.'
                        },
                        'unit': {
                            'type': 'array',
                            'description': 'Unit of measure for each line item (e.g. each, pcs, hr). Return null if not shown.'
                        },
                        'net_price': {
                            'type': 'array',
                            'description': 'Unit net price for each line item. Return null if not shown.'
                        },
                        'net_worth': {
                            'type': 'array',
                            'description': 'Total net worth (quantity × net price) for each line item. Return null if not shown.'
                        },
                        'vat_rate': {
                            'type': 'array',
                            'description': 'VAT or tax rate percentage for each line item (e.g. "10%"). Return null if not shown.'
                        },
                        'gross_worth': {
                            'type': 'array',
                            'description': 'Gross worth including VAT for each line item. Return null if not shown.'
                        }
                    }
                },
                'total_net': {
                    'type': 'string',
                    'description': 'Total net amount before VAT/tax. Usually the Net worth Total row. Include currency symbol. Return null if not present.'
                },
                'total_vat': {
                    'type': 'string',
                    'description': 'Total VAT or tax amount. Include currency symbol. Return null if not present.'
                },
                'total_gross': {
                    'type': 'string',
                    'description': 'Final total amount due including all taxes — the amount to be paid. Include currency symbol.'
                },
                'payment_reference': {
                    'type': 'string',
                    'description': 'Payment KID number, reference number, or any other payment reference code. NOT the IBAN. Return null if not present.'
                },
                'summary': {
                    'type': 'string',
                    'description': '2-3 sentences describing what this document is, who issued it to whom, and its purpose. Do NOT list individual line items here.'
                }
            }
        }
    }
):response AS result;
```

### Expected output for `invoice_0_charspace_1.pdf`

```json
{
  "document_type": "invoice",
  "title": "Invoice",
  "invoice_number": "12060439",
  "invoice_date": "08/29/2020",
  "due_date": null,
  "sender_name": "Brown-Johnson",
  "sender_address": "310 Amanda Corner Suite 472, North William, MN 33119",
  "sender_tax_id": "981-94-7235",
  "sender_iban": "GB78IXYE58273701690538",
  "recipient_name": "Calderon-Duran",
  "recipient_address": "9884 Roberts Tunnel, North Lindaside, VA 02674",
  "recipient_tax_id": "996-81-8911",
  "line_items": {
    "description": [
      "Rectangle Area Rug Wood Grain Carpet Mat for Living Room Bedroom - 180x60cm",
      "Rug for living room-Minion And Banana Area Rugs Living Room Carpet, Christmas...",
      "Yilong 5'x7.5' Hand Knotted Silk Area Rug Medium Size Classic Floor Carpets 0186"
    ],
    "quantity": ["4,00", "2,00", "3,00"],
    "unit": ["each", "each", "each"],
    "net_price": ["32,81", "29,96", "2 800,00"],
    "net_worth": ["131,24", "59,92", "8 400,00"],
    "vat_rate": ["10%", "10%", "10%"],
    "gross_worth": ["144,36", "65,91", "9 240,00"]
  },
  "total_net": "$ 8 591,16",
  "total_vat": "$ 859,12",
  "total_gross": "$ 9 450,28",
  "payment_reference": null,
  "summary": "Invoice no. 12060439 issued by Brown-Johnson to Calderon-Duran on 08/29/2020 for three area rug products. Total gross amount due is $9,450.28 including 10% VAT."
}
```

> **Note on pricing:** AI_EXTRACT uses the `arctic_extract` model at 5 credits per million tokens (~3-5 credits per 1,000 pages). For a typical single invoice or report this is negligible (< 0.01 credits).

## Step 4: Write the JSON summary file

Take the `result` object from the query output and write it as `<original_filename>_summary.json` next to the original PDF using the Write tool. Ensure the output is valid JSON.

## Step 5: Write a plain-text summary file

Using the extracted data from Step 3, write a human-readable `<original_filename>_summary.txt` next to the original PDF. Use this template, skipping any line whose value is null:

```
INVOICE SUMMARY
===============
Document Type : <document_type>
Title         : <title>
Invoice No.   : <invoice_number>
Issue Date    : <invoice_date>
Due Date      : <due_date>

FROM
----
<sender_name>
<sender_address>
Tax ID : <sender_tax_id>
IBAN   : <sender_iban>

TO
--
<recipient_name>
<recipient_address>
Tax ID : <recipient_tax_id>

LINE ITEMS
----------
<For each line item, one row:>
  - <description> | Qty: <quantity> <unit> | Net: <net_price> | Net worth: <net_worth> | VAT: <vat_rate> | Gross: <gross_worth>

TOTALS
------
Net Total  : <total_net>
VAT        : <total_vat>
Gross Total: <total_gross>

PAYMENT
-------
Reference : <payment_reference>

SUMMARY
-------
<summary>
```

## Step 6: Clean up the stage file

```sql
REMOVE @pdf_processor_stage/<filename.pdf>;
```

## Step 7: Report findings

Summarize in plain language:
- What the document is and who it is from/to
- Key dates, amounts, or names
- Any action items or deadlines found

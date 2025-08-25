import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

// Define proper interfaces for type safety
interface SummaryDetail {
  [key: string]: any;
}

interface Price {
  [key: string]: any;
}

interface StockData {
  summaryDetail: SummaryDetail;
  price: Price;
}

interface TableProviderProps {
  result: StockData;
}

export function TableProvider({ result }: TableProviderProps) {
  // Function to convert stock data to table rows
  const convertToRows = (data: StockData) => {
    const rows: Array<{ key: string; keyName: string; value: any }> = [];

    const processValue = (value: any) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    };

    for (const [key, value] of Object.entries(data.summaryDetail)) {
        rows.push({ key: `summaryDetail-${key}`, keyName: key, value: processValue(value) });
    }

    for (const [key, value] of Object.entries(data.price)) {
        rows.push({ key: `price-${key}`, keyName: key, value: processValue(value) });
    }

    return rows;
  };

  const DataTable = () => {
    const rows = convertToRows(result).filter((items) => items.value);
    return (
      <Table>
        <TableCaption>A list of stock data.</TableCaption>
        {/* <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Attribute</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader> */}
        <TableBody className="grid grid-flow-col grid-rows-6 gap- md:grid-rows-10">
          {rows.map(row => (
            <TableRow key={row.key} className='flex '>
              <TableCell className=" text-xs">{row.keyName}</TableCell>
              <TableCell className=" text-xs h-0 flex-1 text-right font-medium">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return <DataTable />;
}

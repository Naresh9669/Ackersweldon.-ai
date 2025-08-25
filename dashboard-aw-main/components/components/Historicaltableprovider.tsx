"use client"

import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";

// Define proper interfaces for type safety
interface Quote {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    adjclose: number;
    volume: number;
}

interface Dividend {
    date: number;
    amount: number;
}

interface Split {
    date: number;
    splitRatio: string;
}

// Fix: Update interface to match actual Yahoo Finance API response
interface Events {
    dividends?: any[]; // More flexible to handle actual API response
    splits?: any[]; // More flexible to handle actual API response
}

interface HistoricaltableProviderProps {
    quotes: Quote[];
    events: Events | null;
    filter: string;
}

export function HistoricaltableProvider({ quotes, events, filter }: HistoricaltableProviderProps) {

    if (filter == "") {
        return (
            
            <Table>
                <TableCaption>List of Historical Prices</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Open</TableHead>
                        <TableHead>High</TableHead>
                        <TableHead>Low</TableHead>
                        <TableHead>closed</TableHead>
                        <TableHead>Adj closed</TableHead>
                        <TableHead>Volume</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {quotes.map((quote, index) => {
                        return (
                            <TableRow key={index}>
                                <TableCell >{quote.date.toLocaleDateString('sv-SE')}</TableCell>
                                <TableCell>{quote.open}</TableCell>
                                <TableCell>{quote.high}</TableCell>
                                <TableCell>{quote.low}</TableCell>
                                <TableCell>{quote.close}</TableCell>
                                <TableCell>{quote.adjclose}</TableCell>
                                <TableCell>{quote.volume}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        );
    }
    else if (events == null) {
        return (
        
            <Table>
                <TableCaption>No data found</TableCaption>
            </Table>
        );

    }
    else if (filter == "div") {

        var divs = events.dividends;

        return (
            
            <Table>
                <TableCaption>List of Dividents</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Divident</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {divs?.map((elem, index) => {
                        return (
                            <TableRow key={index}>
                                <TableCell >{new Date(elem.date * 1000).toLocaleDateString()}</TableCell>
                                <TableCell>{elem.amount + " Divident"}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        );
    }
    else if (filter == "split") { // Fix: Changed = to == for comparison

        var splits = events.splits;

        return (
        
            <Table>
                <TableCaption>List of Stock Splits</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Stock Splits</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {splits?.map((elem, index) => {
                        return (
                            <TableRow key={index}>
                                <TableCell >{new Date(elem.date * 1000).toLocaleDateString()}</TableCell>
                                <TableCell>{elem.splitRatio + " Split Ratio"}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        );
    }
    // else if(filter = "earn"){

    //     return (
        
    //         <Table>
    //             <TableCaption>List of Historical Prices</TableCaption>
    //             <TableHeader>
    //                 <TableRow>
    //                     <TableHead>Date</TableHead>
    //                 </TableRow>
    //             </TableHeader>
    //             <TableBody>
    //                 {quotes.map((quote, index) => {
    //                     return (
    //                         <TableRow key={index}>
    //                             <TableCell >{quote.date.toLocaleDateString('sv-SE')}</TableCell>
    //                             <TableCell>{quote.open}</TableCell>
    //                             <TableCell>{quote.high}</TableCell>
    //                             <TableCell>{quote.low}</TableCell>
    //                             <TableCell>{quote.close}</TableCell>
    //                             <TableCell>{quote.adjclose}</TableCell>
    //                             <TableCell>{quote.volume}</TableCell>
    //                         </TableRow>
    //                     )
    //                 })}
    //             </TableBody>
    //         </Table>
    //     );
    // }
}
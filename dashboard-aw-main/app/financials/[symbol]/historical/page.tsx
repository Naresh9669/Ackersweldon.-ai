import { NavBar } from "@/components/components/NavBarFinancials";
import { SideBar } from "@/components/components/SideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import yahooFinance from 'yahoo-finance2';
import { HistoricaltableProvider } from "@/components/components/Historicaltableprovider";
import { DropdownHistorical } from "@/components/components/DropdownHistorical";
import { DatepickerHistorical } from "@/components/components/DatepickerHistorical";
import { Historicalfilter } from "@/components/components/Historicalfilter";
import { addDays } from "date-fns"
import { DateRange } from "react-day-picker"

// Define proper interfaces for type safety
interface SearchParams {
    datefrom?: string;
    dateto?: string;
    interval?: string;
    filter?: string;
}

// Fix: Update interface to match Yahoo Finance API requirements
interface QueryOptions {
    period1: string;
    period2: string;
    interval: "1d" | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "5d" | "1wk" | "1mo" | "3mo";
    filter: string;
    return: "object"; // Required by Yahoo Finance API
}

type Props = {
    params: {
        symbol: string
    }
    searchParams?: SearchParams
}

export default async function FinancialDetailsPage({ params, searchParams }: Props) {
    const { symbol } = await params;
    
    // Fix: Safe property access with proper typing
    const searchParamsData = await searchParams;
    let datefrom = searchParamsData?.datefrom;
    let dateto = searchParamsData?.dateto;
    let interval = searchParamsData?.interval;
    let filter = searchParamsData?.filter || "";

    const date = new Date();
    date.setDate(date.getDate() - 7);

    var _interval = interval == null ? "1d" : interval;
    var _datefrom = datefrom == null || datefrom == "" ? date.toLocaleDateString('sv-SE') : datefrom;

    // Fix: Define proper queryOptions interface
    var queryOptions: QueryOptions = {
        period1: _datefrom,
        period2: "", // Will be set below
        interval: _interval as "1d" | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "5d" | "1wk" | "1mo" | "3mo",
        filter: filter,
        return: "object"
    };

    if (dateto == null) {
        queryOptions.period2 = addDays(_datefrom, 8).toLocaleDateString('sv-SE');
    } else if (dateto == "" || dateto == _datefrom) {
        queryOptions.period2 = addDays(_datefrom, 1).toLocaleDateString('sv-SE');
    } else {
        queryOptions.period2 = dateto;
    }

    const result = await yahooFinance.chart(symbol, queryOptions);

    return (
        <SidebarProvider defaultOpen>
            <SideBar />
            <div className="p-3 w-full">
                <NavBar symbol={symbol} category={"Historical"} />
                <div className="w-full p-4 ">
                    {/* <NewsCardList title={"test"} news={specificSourceNews} sidemenus={sideMenu} /> */}
                    <div className="flex justify-center gap-40">
                        <DatepickerHistorical />
                        <Historicalfilter />
                        <DropdownHistorical />
                    </div>
                    {/* Fix: Handle the actual Yahoo Finance API response structure */}
                    <HistoricaltableProvider 
                        quotes={(result as any).quotes || []} 
                        events={(result as any).events || null} 
                        filter={filter} 
                    />

                </div>
            </div>
        </SidebarProvider>
    );
}

// components/customers/CustomerTable/CustomerFilters.js
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

export function CustomerFilters({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  setStatusFilter,
  areaFilter,
  setAreaFilter,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  startEndDate,
  setStartEndDate,
  endEndDate,
  setEndEndDate,
  availableAreas,
  showFilters,
  setShowFilters,
  areaOpen,
  setAreaOpen
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              {showFilters ? (
                <X className="h-4 w-4" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {(globalFilter ||
              statusFilter ||
              areaFilter ||
              minAmount ||
              maxAmount ||
              startEndDate ||
              endEndDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGlobalFilter("");
                  setStatusFilter("");
                  setAreaFilter("");
                  setMinAmount("");
                  setMaxAmount("");
                  setStartEndDate("");
                  setEndEndDate("");
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Main search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or customer ID..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Area</Label>
                <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={areaOpen}
                      className="w-full justify-between text-sm font-normal"
                    >
                      {areaFilter || "All Areas"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search area..." />
                      <CommandList>
                        <CommandEmpty>No area found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__all__"
                            onSelect={() => {
                              setAreaFilter("");
                              setAreaOpen(false);
                            }}
                          >
                            All Areas
                          </CommandItem>
                          {availableAreas.map((area) => (
                            <CommandItem
                              key={area}
                              value={area}
                              onSelect={() => {
                                setAreaFilter(area);
                                setAreaOpen(false);
                              }}
                            >
                              {area}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Loan Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">End Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startEndDate}
                    onChange={(e) => setStartEndDate(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={endEndDate}
                    onChange={(e) => setEndEndDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
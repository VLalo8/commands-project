import { useMemo, useState } from "react";
import "./index.css";
import {
	DEFAULT_OPERATORS,
	buildQuery,
	openInGoogle,
} from "@/lib/queryBuilder";
import type { OperatorKey, OperatorToken } from "@/lib/queryBuilder";
import { loadHistory, removeFromHistory, saveToHistory } from "@/lib/history";
import type { SavedQuery } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Sun, Moon, Search } from "lucide-react";

function App() {
	const [freeText, setFreeText] = useState("");
	const [tokens, setTokens] = useState<OperatorToken[]>([]);
	const [newValue, setNewValue] = useState("");
	const [selectedOperator, setSelectedOperator] = useState<OperatorKey>("site");

	const query = useMemo(
		() => buildQuery({ freeText, tokens }),
		[freeText, tokens]
	);
	const [history, setHistory] = useState<SavedQuery[]>(() => loadHistory());

	function addToken() {
		if (!newValue.trim()) return;
		const id = crypto.randomUUID();
		const key = selectedOperator;
		let token: OperatorToken | null = null;

		if (key === "range") {
			const match = newValue.match(/(\d+)\s*\.\.\s*(\d+)/);
			if (match) {
				token = {
					id,
					key,
					label: "Range",
					value: { from: Number(match[1]), to: Number(match[2]) },
				} as OperatorToken;
			}
		} else if (key === "or") {
			const parts = newValue
				.split(/\s+OR\s+|,/i)
				.map((s) => s.trim())
				.filter(Boolean);
			if (parts.length > 0) {
				token = { id, key, label: "OR", value: parts } as OperatorToken;
			}
		} else if (
			[
				"site",
				"intitle",
				"inurl",
				"filetype",
				"exact",
				"exclude",
				"after",
				"before",
			].includes(key)
		) {
			token = {
				id,
				key: key as any,
				label: humanize(key),
				value: newValue,
			} as OperatorToken;
		}

		if (token) {
			setTokens((prev) => [...prev, token!]);
			setNewValue("");
		}
	}

	function removeToken(id: string) {
		setTokens((prev) => prev.filter((t) => t.id !== id));
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
				<div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-primary/10">
							<Search className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h1 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent">
								Google Search Command Master
							</h1>
							<p className="text-xs text-muted-foreground">
								Build powerful search queries
							</p>
						</div>
					</div>
					<div>
						<Button
							variant="outline"
							onClick={() => document.documentElement.classList.toggle("dark")}
							aria-label="Toggle theme"
							className="gap-2"
						>
							<Sun className="h-4 w-4 hidden dark:block" />
							<Moon className="h-4 w-4 dark:hidden" />
							<span className="hidden sm:inline">Theme</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-6 py-6">
				<main className="space-y-6">
					<Card className="border-primary/20 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-semibold">
								Search terms
							</CardTitle>
							<CardDescription>
								Type general keywords. Add operators below.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Input
								placeholder="What are you searching for?"
								value={freeText}
								onChange={(e) => setFreeText(e.target.value)}
								className="h-12 text-base"
							/>
						</CardContent>
					</Card>

					<Card className="border-accent/20 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-semibold">Operators</CardTitle>
							<CardDescription>
								Pick an operator and provide its value
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div>
									<label className="block text-xs text-muted-foreground mb-1">
										Operator
									</label>
									<Select
										value={selectedOperator}
										onValueChange={(v) => setSelectedOperator(v as OperatorKey)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Choose operator" />
										</SelectTrigger>
										<SelectContent>
											{DEFAULT_OPERATORS.map((op) => (
												<SelectItem key={op.key} value={op.key}>
													{op.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground mt-1">
										{
											DEFAULT_OPERATORS.find((o) => o.key === selectedOperator)
												?.hint
										}
									</p>
								</div>
								<div className="md:col-span-2">
									<label className="block text-xs text-muted-foreground mb-1">
										Value
									</label>
									<Input
										placeholder={placeholderFor(selectedOperator)}
										value={newValue}
										onChange={(e) => setNewValue(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") addToken();
										}}
									/>
									<div className="mt-2">
										<Button onClick={addToken}>Add operator</Button>
									</div>
								</div>
							</div>

							{tokens.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-1">
									{tokens.map((t) => (
										<TooltipProvider key={t.id}>
											<Tooltip>
												<TooltipTrigger asChild>
													<button onClick={() => removeToken(t.id)}>
														<Badge className="gap-2 cursor-default">
															<span className="font-medium">{t.label}: {renderValue(t)}</span>
															<div
																className="text-neutral-500 hover:text-neutral-800"
																aria-label="Remove"
															>
																×
															</div>
														</Badge>
													</button>
												</TooltipTrigger>
												<TooltipContent>
													<div className="text-xs max-w-xs">
														{
															DEFAULT_OPERATORS.find((o) => o.label === t.label)
																?.hint
														}
													</div>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="border-primary/20 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-semibold">Preview</CardTitle>
							<CardDescription>
								Review and use your composed query
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-row flex-wrap md:flex-nowrap justify-between gap-4">
								<div className="h-12 w-4/5 rounded-lg border-2 border-dashed border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm overflow-x-auto font-mono">
									{query || (
										<span className="text-muted-foreground">
											Your query will appear here…
										</span>
									)}
								</div>

								<Button
									variant="blue"
									onClick={() => openInGoogle(query)}
									className="gap-2 h-12"
								>
									<Search className="h-4 w-4" />
									Open in Google
								</Button>
							</div>
							<div className="mt-4 flex flex-wrap gap-3">
								<Button
									variant="outline"
									onClick={() => navigator.clipboard.writeText(query)}
									className="gap-2"
								>
									<span>📋</span>
									Copy
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										const entry: SavedQuery = {
											id: crypto.randomUUID(),
											label: freeText || "Saved query",
											query,
											createdAt: Date.now(),
										};
										saveToHistory(entry);
										setHistory(loadHistory());
									}}
									className="gap-2"
								>
									<span>💾</span>
									Save to history
								</Button>
								<Button
									variant="outline"
									onClick={() => setTokens([])}
									className="gap-2"
								>
									<span>🗑️</span>
									Clear operators
								</Button>
							</div>
						</CardContent>
					</Card>

					{history.length > 0 && (
						<Card className="border-secondary/20 shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="text-xl font-semibold">History</CardTitle>
								<CardDescription>Your recently saved queries</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-end mb-2">
									<Button
										variant="secondary"
										className="h-8 px-2 text-xs"
										onClick={() => {
											localStorage.clear();
											setHistory([]);
										}}
									>
										Clear all
									</Button>
								</div>
								<ul className="space-y-2">
									{history.map((h) => (
										<li
											key={h.id}
											className="flex items-center justify-between gap-3"
										>
											<button
												className="text-left flex-1 truncate hover:underline"
												onClick={() =>
													window.open(
														`https://www.google.com/search?q=${encodeURIComponent(
															h.query
														)}`,
														"_blank"
													)
												}
												title={h.query}
											>
												{h.label}
											</button>
											<div className="text-xs text-muted-foreground">
												{new Date(h.createdAt).toLocaleString()}
											</div>
											<button
												className="text-neutral-500 hover:text-neutral-800 text-sm"
												onClick={() => {
													removeFromHistory(h.id);
													setHistory(loadHistory());
												}}
												aria-label="Remove"
											>
												×
											</button>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}
				</main>
			</div>
		</div>
	);
}

function humanize(key: string) {
	return key.charAt(0).toUpperCase() + key.slice(1);
}

function placeholderFor(key: OperatorKey) {
	switch (key) {
		case "site":
			return "example.com";
		case "intitle":
			return "terms in title";
		case "inurl":
			return "path or keyword in URL";
		case "filetype":
			return "pdf, docx, xlsx";
		case "exact":
			return "exact phrase";
		case "exclude":
			return "term to exclude";
		case "after":
			return "YYYY-MM-DD";
		case "before":
			return "YYYY-MM-DD";
		case "range":
			return "e.g. 2010..2020";
		case "or":
			return "term1 OR term2 OR term3";
	}
}

function renderValue(t: OperatorToken) {
	switch (t.key) {
		case "range":
			return `${t.value.from}..${t.value.to}`;
		case "or":
			return (t.value as string[]).join(" OR ");
		default:
			return (t as any).value as string;
	}
}

export default App;

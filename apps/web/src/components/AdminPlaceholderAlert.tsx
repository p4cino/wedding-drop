import React from "react";

interface AdminPlaceholderAlertProps {
	description: string;
}

export function AdminPlaceholderAlert({
	description,
}: AdminPlaceholderAlertProps) {
	return (
		<div className="mt-12 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
			<p className="font-semibold mb-1">Uwaga dla administratora:</p>
			<p>{description}</p>
		</div>
	);
}

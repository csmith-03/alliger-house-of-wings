import { useState } from "react";

type Address = {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type Item = {
  id: string;
  name: string;
  qty: number;
  price: number;
  image?: string;
};

type Rate = {
  object_id: string;
  provider: string;
  servicelevel: { name: string };
  amount: string;
  estimated_days?: number;
};

export default function ShippingRates({
  items,
  onSelect,
}: {
  items: Item[];
  onSelect: (rate: Rate | null) => void;
}) {
  const [address, setAddress] = useState<Address>({
    name: "",
    street1: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchRates = async () => {
    setLoading(true);
    setError("");
    setRates([]);
    setSelected(null);
    onSelect(null);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch rates");
      setRates(data.rates || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSelect = (rate: Rate) => {
    setSelected(rate.object_id);
    onSelect(rate);
  };

  return (
    <div className="mb-4 p-4 border rounded">
      <h3 className="font-semibold mb-2">Shipping Address</h3>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input placeholder="Name" value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} className="border p-1" />
        <input placeholder="Street" value={address.street1} onChange={e => setAddress(a => ({ ...a, street1: e.target.value }))} className="border p-1" />
        <input placeholder="City" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className="border p-1" />
        <input placeholder="State" value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} className="border p-1" />
        <input placeholder="ZIP" value={address.zip} onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))} className="border p-1" />
        <input placeholder="Country" value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} className="border p-1" />
      </div>
      <button
        type="button"
        onClick={fetchRates}
        disabled={loading || !address.name || !address.street1 || !address.city || !address.state || !address.zip}
        className="bg-gray-800 text-white px-3 py-1 rounded mb-2"
      >
        {loading ? "Loading..." : "Get Shipping Rates"}
      </button>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <ul>
        {rates.map(rate => (
          <li key={rate.object_id} className="mb-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="shippingRate"
                checked={selected === rate.object_id}
                onChange={() => handleSelect(rate)}
              />
              {rate.provider} {rate.servicelevel.name} - ${rate.amount}
              {rate.estimated_days && <span>({rate.estimated_days} days)</span>}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
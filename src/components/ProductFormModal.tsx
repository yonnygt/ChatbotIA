"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";

interface ProductFormModalProps {
    product?: Product | null;
    onClose: () => void;
    onSaved: () => void;
}

const CATEGORIES = ["res", "cerdo", "pollo", "charcutería", "otros"];

export default function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
    const isEdit = !!product;
    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "res",
        price: "",
        unit: "kg",
        imageUrl: "",
        sku: "",
        location: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name,
                description: product.description || "",
                category: product.category,
                price: product.price,
                unit: product.unit || "kg",
                imageUrl: product.imageUrl || "",
                sku: product.sku || "",
                location: product.location || "",
            });
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const url = "/api/products";
            const method = isEdit ? "PATCH" : "POST";
            const body = isEdit
                ? { id: product!.id, ...form }
                : form;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!product || !confirm("¿Estás seguro de eliminar este producto?")) return;

        try {
            const res = await fetch(`/api/products?id=${product.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al eliminar");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-surface-dark border border-white/10 rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-elevated">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-extrabold text-white">
                        {isEdit ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-400 text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="Ej: Lomo de res"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all resize-none"
                            placeholder="Descripción opcional"
                        />
                    </div>

                    {/* Category + Price row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Categoría *</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Precio USD *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Unit + SKU row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Unidad</label>
                            <select
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                            >
                                <option value="kg">Kilogramo (kg)</option>
                                <option value="lb">Libra (lb)</option>
                                <option value="unidad">Unidad</option>
                                <option value="paquete">Paquete</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">SKU</label>
                            <input
                                type="text"
                                value={form.sku}
                                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Ubicación</label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="Ej: Vitrina A"
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">URL de Imagen</label>
                        <input
                            type="url"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-background-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="https://..."
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl p-3">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {isEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/25 transition-all"
                            >
                                Eliminar
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-bold hover:bg-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-primary text-background-dark text-sm font-bold shadow-glow hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

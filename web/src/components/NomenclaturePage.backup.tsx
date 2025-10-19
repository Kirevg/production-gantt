import React, { useState, useEffect } from 'react';
import '../styles/buttons.css';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    LinearProgress,
    Alert,
    CircularProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Menu,
    ListItemIcon,
    ListItemText,
    Checkbox,
    ListItemButton,
    Radio,
    FormControlLabel
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Upload as UploadIcon,
    AddBox as AddBoxIcon,
    IndeterminateCheckBox as MinusBoxIcon,
    Menu as MenuIcon,
    Add as AddIcon,
    KeyboardArrowUp as ArrowUpIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Sort as SortIcon
} from '@mui/icons-material';
import VolumeButton from './VolumeButton';
import * as XLSX from 'xlsx';

// РРЅС‚РµСЂС„РµР№СЃ РґР»СЏ РµРґРёРЅРёС†С‹ РёР·РјРµСЂРµРЅРёСЏ
interface Unit {
    id: string;
    code: string;
    name: string;
    fullName?: string;
    internationalCode?: string;
}

// РРЅС‚РµСЂС„РµР№СЃ РґР»СЏ РІРёРґР° РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
interface NomenclatureKind {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// РРЅС‚РµСЂС„РµР№СЃ РґР»СЏ РіСЂСѓРїРїС‹ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
interface NomenclatureGroup {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
}

// РРЅС‚РµСЂС„РµР№СЃ РґР»СЏ РґРµСЂРµРІР° РіСЂСѓРїРї
interface NomenclatureGroupTree extends NomenclatureGroup {
    children: NomenclatureGroupTree[];
}

// РРЅС‚РµСЂС„РµР№СЃ РґР»СЏ РїРѕР·РёС†РёРё РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
interface NomenclatureItem {
    id: string;
    groupId?: string;
    kindId?: string;
    designation?: string;
    name: string;
    article?: string;
    code1c?: string;
    manufacturer?: string;
    description?: string;
    unit?: string;
    price?: number;
    createdAt: string;
    updatedAt: string;
}

interface NomenclaturePageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const NomenclaturePage: React.FC<NomenclaturePageProps> = ({
    canEdit,
    canCreate,
    canDelete
}) => {
    const [groups, setGroups] = useState<NomenclatureGroup[]>([]);
    const [kinds, setKinds] = useState<NomenclatureKind[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [items, setItems] = useState<NomenclatureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Р Р°СЃРєСЂС‹С‚С‹Рµ РіСЂСѓРїРїС‹
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // Р¤РёР»СЊС‚СЂ РїРѕ РіСЂСѓРїРїРµ
    const [selectedKindId, setSelectedKindId] = useState<string | null>(null); // Р¤РёР»СЊС‚СЂ РїРѕ РІРёРґСѓ
    const [rightPanelMode, setRightPanelMode] = useState<'groups' | 'kinds'>('groups'); // Р РµР¶РёРј РїСЂР°РІРѕР№ РїР°РЅРµР»Рё

    // РЎРѕСЃС‚РѕСЏРЅРёРµ РґР»СЏ РјРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ РіСЂСѓРїРїР°РјРё
    const [groupsMenuAnchor, setGroupsMenuAnchor] = useState<null | HTMLElement>(null);
    const [showNestedGroups, setShowNestedGroups] = useState(false); // РџРѕРєР°Р·С‹РІР°С‚СЊ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂСѓ РІР»РѕР¶РµРЅРЅС‹С… РіСЂСѓРїРї
    const [sortByName, setSortByName] = useState(true); // РЎРѕСЂС‚РёСЂРѕРІР°С‚СЊ РїРѕ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ

    // РЎРѕСЃС‚РѕСЏРЅРёРµ РґР»СЏ РґРёР°Р»РѕРіР° РіСЂСѓРїРїС‹
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [editingGroup, setEditingGroup] = useState<NomenclatureGroup | null>(null);
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: '',
        parentId: ''
    });

    // РЎРѕСЃС‚РѕСЏРЅРёРµ РґР»СЏ РґРёР°Р»РѕРіР° РїРѕР·РёС†РёРё
    const [openItemDialog, setOpenItemDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<NomenclatureItem | null>(null);
    const [itemForm, setItemForm] = useState({
        groupId: '',
        kindId: '',
        unitId: '',
        type: 'Product',
        designation: '',
        name: '',
        article: '',
        code1c: '',
        manufacturer: '',
        description: '',
        price: ''
    });

    // РЎРѕСЃС‚РѕСЏРЅРёРµ РґР»СЏ РґРёР°Р»РѕРіР° РёРјРїРѕСЂС‚Р°
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isFileProcessing, setIsFileProcessing] = useState(false);
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [excelData, setExcelData] = useState<any[][]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
    const [noHeaders, setNoHeaders] = useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState({ existing: 0, new: 0, total: 0 });
    const [previewFilter, setPreviewFilter] = useState<'all' | 'existing' | 'new'>('all');

    // РЎРѕСЃС‚РѕСЏРЅРёСЏ РґР»СЏ РґРµС‚Р°Р»СЊРЅРѕРіРѕ СЃСЂР°РІРЅРµРЅРёСЏ
    const [showCompareDialog, setShowCompareDialog] = useState(false);
    const [compareItem, setCompareItem] = useState<any>(null);
    const [updateFields, setUpdateFields] = useState<{ [key: string]: boolean }>({});

    // Р¤СѓРЅРєС†РёСЏ С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёСЏ РґР°С‚С‹

    // РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРёРµ РєРѕР»РѕРЅРѕРє РїРѕ Р·Р°РіРѕР»РѕРІРєР°Рј
    const autoMapColumns = (headers: any[]) => {
        const mapping: { [key: string]: string } = {};

        // РЎР»РѕРІР°СЂСЊ РІРѕР·РјРѕР¶РЅС‹С… РІР°СЂРёР°РЅС‚РѕРІ РЅР°Р·РІР°РЅРёР№ РєРѕР»РѕРЅРѕРє
        const columnVariants: { [key: string]: string[] } = {
            'designation': ['РѕР±РѕР·РЅР°С‡РµРЅРёРµ', 'designation', 'РєРѕРґ РёР·РґРµР»РёСЏ', 'С€РёС„СЂ'],
            'name': ['РЅР°РёРјРµРЅРѕРІР°РЅРёРµ', 'РЅР°Р·РІР°РЅРёРµ', 'name', 'РЅРѕРјРµРЅРєР»Р°С‚СѓСЂР°'],
            'article': ['Р°СЂС‚РёРєСѓР»', 'article', 'Р°СЂС‚'],
            'code1c': ['РєРѕРґ 1СЃ', 'РєРѕРґ1СЃ', 'code1c', '1c', 'РєРѕРґ'],
            'group': ['РіСЂСѓРїРїР°', 'group', 'РєР°С‚РµРіРѕСЂРёСЏ'],
            'manufacturer': ['РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ', 'manufacturer', 'РёР·РіРѕС‚РѕРІРёС‚РµР»СЊ'],
            'description': ['РѕРїРёСЃР°РЅРёРµ', 'description', 'РїСЂРёРјРµС‡Р°РЅРёРµ'],
            'unit': ['РµРґ. РёР·РјРµСЂРµРЅРёСЏ', 'РµРґРёРЅРёС†Р°', 'unit', 'РµРґ', 'РµРґРёРЅРёС†Р° РёР·РјРµСЂРµРЅРёСЏ'],
            'price': ['С†РµРЅР°', 'price', 'СЃС‚РѕРёРјРѕСЃС‚СЊ']
        };

        headers.forEach((header: any, index: number) => {
            if (!header) return;

            const headerLower = header.toString().toLowerCase().trim();

            // РС‰РµРј СЃРѕРІРїР°РґРµРЅРёРµ СЃ РёР·РІРµСЃС‚РЅС‹РјРё РІР°СЂРёР°РЅС‚Р°РјРё
            for (const [fieldName, variants] of Object.entries(columnVariants)) {
                for (const variant of variants) {
                    if (headerLower.includes(variant) || variant.includes(headerLower)) {
                        // РџСЂРѕРІРµСЂСЏРµРј, РЅРµ Р·Р°РЅСЏС‚Рѕ Р»Рё СѓР¶Рµ СЌС‚Рѕ РїРѕР»Рµ
                        const isAlreadyMapped = Object.values(mapping).includes(fieldName);
                        if (!isAlreadyMapped) {
                            mapping[index.toString()] = fieldName;
                            break;
                        }
                    }
                }
            }
        });

        return mapping;
    };

    // РћР±СЂР°Р±РѕС‚РєР° Excel С„Р°Р№Р»Р°
    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                if (jsonData.length > 0) {
                    setExcelData(jsonData as any[][]);

                    // РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРёРµ РєРѕР»РѕРЅРѕРє РЅР° РѕСЃРЅРѕРІРµ Р·Р°РіРѕР»РѕРІРєРѕРІ
                    if (jsonData[0]) {
                        const autoMapping = autoMapColumns(jsonData[0] as any[]);
                        setColumnMapping(autoMapping);
                    }

                    // РќР• РѕС‚РєСЂС‹РІР°РµРј СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРёРµ РєРѕР»РѕРЅРѕРє Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё
                } else {
                    alert('Р¤Р°Р№Р» РїСѓСЃС‚ РёР»Рё РЅРµ СЃРѕРґРµСЂР¶РёС‚ РґР°РЅРЅС‹С…');
                }
            } catch (error) {
                console.error('РћС€РёР±РєР° С‡С‚РµРЅРёСЏ С„Р°Р№Р»Р°:', error);
                alert('РћС€РёР±РєР° С‡С‚РµРЅРёСЏ С„Р°Р№Р»Р°. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ С„Р°Р№Р» СЏРІР»СЏРµС‚СЃСЏ РєРѕСЂСЂРµРєС‚РЅС‹Рј Excel С„Р°Р№Р»РѕРј.');
            } finally {
                setIsFileProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    // РђРЅР°Р»РёР· РґР°РЅРЅС‹С… РёРјРїРѕСЂС‚Р°
    const analyzeImportData = async () => {
        try {
            setLoading(true);

            // РџСЂРѕРїСѓСЃРєР°РµРј Р·Р°РіРѕР»РѕРІРѕРє (РїРµСЂРІСѓСЋ СЃС‚СЂРѕРєСѓ), РµСЃР»Рё С‚Р°Р±Р»РёС†Р° СЃ Р·Р°РіРѕР»РѕРІРєР°РјРё
            const rows = noHeaders ? excelData : excelData.slice(1);
            const analyzedData: any[] = [];
            let existingCount = 0;
            let newCount = 0;

            // РђРЅР°Р»РёР·РёСЂСѓРµРј РєР°Р¶РґСѓСЋ СЃС‚СЂРѕРєСѓ
            for (const row of rows) {
                if (row.length < 2) continue; // РџСЂРѕРїСѓСЃРєР°РµРј РїСѓСЃС‚С‹Рµ СЃС‚СЂРѕРєРё

                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('РўРѕРєРµРЅ Р°РІС‚РѕСЂРёР·Р°С†РёРё РЅРµ РЅР°Р№РґРµРЅ');
                    return;
                }

                // РџР°СЂСЃРёРј РґР°РЅРЅС‹Рµ РёР· СЃС‚СЂРѕРєРё СЃРѕРіР»Р°СЃРЅРѕ СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРёСЋ РєРѕР»РѕРЅРѕРє
                const nomenclatureData: any = {};

                Object.entries(columnMapping).forEach(([columnIndex, fieldName]) => {
                    const value = row[parseInt(columnIndex)];
                    if (value !== undefined && value !== null && value !== '') {
                        if (fieldName === 'price') {
                            nomenclatureData[fieldName] = parseFloat(value) || undefined;
                        } else {
                            nomenclatureData[fieldName] = value.toString();
                        }
                    }
                });

                // РџСЂРѕРІРµСЂСЏРµРј РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ
                if (!nomenclatureData.name) {
                    continue;
                }

                // РС‰РµРј СЃСѓС‰РµСЃС‚РІСѓСЋС‰СѓСЋ РїРѕР·РёС†РёСЋ РІ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂРµ РїРѕ РћР±РѕР·РЅР°С‡РµРЅРёСЋ, РќР°РёРјРµРЅРѕРІР°РЅРёСЋ, РђСЂС‚РёРєСѓР»Сѓ, РљРѕРґ 1РЎ
                let existingItem = null;

                // РџР РРћР РРўР•Рў 0: РЎРЅР°С‡Р°Р»Р° РёС‰РµРј РїРѕ РѕР±РѕР·РЅР°С‡РµРЅРёСЋ (СЃР°РјРѕРµ РІР°Р¶РЅРѕРµ РїРѕР»Рµ РґР»СЏ HWM)
                if (!existingItem && nomenclatureData.name && nomenclatureData.name.trim() !== '') {

                    // РџРѕР»СѓС‡Р°РµРј РІСЃРµ СЌР»РµРјРµРЅС‚С‹ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹ РґР»СЏ РїРѕРёСЃРєР° РїРѕ РѕР±РѕР·РЅР°С‡РµРЅРёСЋ
                    const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (searchResponse.ok) {
                        const allItems = await searchResponse.json();

                        // РС‰РµРј СЌР»РµРјРµРЅС‚С‹, Сѓ РєРѕС‚РѕСЂС‹С… РѕР±РѕР·РЅР°С‡РµРЅРёРµ СЃРѕРІРїР°РґР°РµС‚ СЃ РЅР°С‡Р°Р»РѕРј РЅР°Р·РІР°РЅРёСЏ РёР· Excel
                        for (const dbItem of allItems) {
                            if (dbItem.designation && dbItem.designation.trim() !== '') {
                                // РќРѕСЂРјР°Р»РёР·СѓРµРј РѕР±РѕР·РЅР°С‡РµРЅРёСЏ РґР»СЏ СЃСЂР°РІРЅРµРЅРёСЏ
                                const normalizeDesignation = (designation: string) => {
                                    return designation.toLowerCase()
                                        .replace(/\./g, ' ')  // С‚РѕС‡РєРё РІ РїСЂРѕР±РµР»С‹
                                        .replace(/\s+/g, ' ') // РјРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Рµ РїСЂРѕР±РµР»С‹ РІ РѕРґРёРЅР°СЂРЅС‹Рµ
                                        .trim();
                                };

                                // РќРѕСЂРјР°Р»РёР·СѓРµРј РЅР°Р·РІР°РЅРёРµ РёР· Excel С‚Р°Рє Р¶Рµ, РєР°Рє РѕР±РѕР·РЅР°С‡РµРЅРёРµ РёР· Р±Р°Р·С‹
                                const excelName = normalizeDesignation(nomenclatureData.name);
                                const dbDesignation = normalizeDesignation(dbItem.designation);


                                // РџСЂРѕРІРµСЂСЏРµРј, РЅР°С‡РёРЅР°РµС‚СЃСЏ Р»Рё РЅР°Р·РІР°РЅРёРµ РёР· Excel СЃ РѕР±РѕР·РЅР°С‡РµРЅРёСЏ РёР· Р±Р°Р·С‹
                                if (excelName.startsWith(dbDesignation)) {
                                    existingItem = dbItem;
                                    break;
                                }
                            }
                        }

                    }

                    // РџР РРћР РРўР•Рў 1: Р•СЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ РїРѕ РѕР±РѕР·РЅР°С‡РµРЅРёСЋ, РёС‰РµРј РїРѕ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ (С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ)
                    if (!existingItem && nomenclatureData.name) {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?name=${encodeURIComponent(nomenclatureData.name)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // РџСЂРѕРІРµСЂСЏРµРј С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ РїРѕ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ
                            if (foundItem && foundItem.name && foundItem.name.toLowerCase() === nomenclatureData.name.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }

                    // РџР РРћР РРўР•Рў 1.5: РџРѕРёСЃРє "Р·Р°РіСЂСѓР±Р»РµРЅРЅС‹С…" СЃРѕРІРїР°РґРµРЅРёР№ РґР»СЏ РїСЂРµРґР»РѕР¶РµРЅРёСЏ РѕР±СЉРµРґРёРЅРµРЅРёСЏ (РќР• СѓСЃС‚Р°РЅР°РІР»РёРІР°РµРј existingItem!)
                    let suggestedItem = null;
                    if (!existingItem && nomenclatureData.name) {

                        // РџРѕР»СѓС‡Р°РµРј РІСЃРµ СЌР»РµРјРµРЅС‚С‹ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹ РґР»СЏ РїРѕРёСЃРєР° РїРѕ РЅР°Р·РІР°РЅРёСЋ
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const allItems = await searchResponse.json();

                            // Р¤СѓРЅРєС†РёСЏ РЅРѕСЂРјР°Р»РёР·Р°С†РёРё РґР»СЏ "Р·Р°РіСЂСѓР±Р»РµРЅРЅРѕРіРѕ" СЃСЂР°РІРЅРµРЅРёСЏ
                            const normalizeForFuzzyMatch = (text: string) => {
                                return text.toLowerCase()
                                    .replace(/[С…x*]/g, 'С…')  // РІСЃРµ РІР°СЂРёР°РЅС‚С‹ "С…" РІ РµРґРёРЅС‹Р№ СЃРёРјРІРѕР»
                                    .replace(/[.,]/g, ' ')  // С‚РѕС‡РєРё Рё Р·Р°РїСЏС‚С‹Рµ РІ РїСЂРѕР±РµР»С‹
                                    .replace(/[^\w\s]/g, ' ') // РІСЃРµ СЃРїРµС†СЃРёРјРІРѕР»С‹ РІ РїСЂРѕР±РµР»С‹
                                    .replace(/\s+/g, ' ') // РјРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Рµ РїСЂРѕР±РµР»С‹ РІ РѕРґРёРЅР°СЂРЅС‹Рµ
                                    .trim();
                            };

                            const excelNameNormalized = normalizeForFuzzyMatch(nomenclatureData.name);

                            // РС‰РµРј СЌР»РµРјРµРЅС‚С‹ СЃ РїРѕС…РѕР¶РёРјРё РЅР°Р·РІР°РЅРёСЏРјРё
                            for (const dbItem of allItems) {
                                if (dbItem.name && dbItem.name.trim() !== '') {
                                    const dbNameNormalized = normalizeForFuzzyMatch(dbItem.name);


                                    if (excelNameNormalized === dbNameNormalized) {
                                        suggestedItem = dbItem;
                                        break;
                                    }
                                }
                            }

                        }
                    }

                    // РџР РРћР РРўР•Рў 1.5: Р•СЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ РїРѕ С‚РѕС‡РЅРѕРјСѓ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ, РїСЂРѕРІРµСЂСЏРµРј РєРѕРјР±РёРЅР°С†РёСЋ "РѕР±РѕР·РЅР°С‡РµРЅРёРµ + РЅР°РёРјРµРЅРѕРІР°РЅРёРµ"
                    if (!existingItem && nomenclatureData.name && nomenclatureData.designation) {
                        // РС‰РµРј РІ Р±Р°Р·Рµ РїРѕ РѕР±РѕР·РЅР°С‡РµРЅРёСЋ
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?designation=${encodeURIComponent(nomenclatureData.designation)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            if (foundItem && foundItem.designation && foundItem.designation.toLowerCase() === nomenclatureData.designation.toLowerCase()) {
                                // Р’ Excel: "HWM 01 00.00.02 РЎРєРѕР±Р° С…РѕРјСѓС‚Р° РєР°РїСЂРѕР»РѕРЅРѕРІРѕРіРѕ D168.3"
                                // Р’ Р±Р°Р·Рµ: "РЎРєРѕР±Р° С…РѕРјСѓС‚Р° РєР°РїСЂРѕР»РѕРЅРѕРІРѕРіРѕ D168.3" СЃ РѕР±РѕР·РЅР°С‡РµРЅРёРµРј "HWM 01 00.00.02"

                                // РЈР±РёСЂР°РµРј РѕР±РѕР·РЅР°С‡РµРЅРёРµ РёР· РЅР°С‡Р°Р»Р° РЅР°Р·РІР°РЅРёСЏ Excel Рё СЃСЂР°РІРЅРёРІР°РµРј СЃ РЅР°Р·РІР°РЅРёРµРј РёР· Р±Р°Р·С‹
                                const excelNameWithoutDesignation = nomenclatureData.name.toLowerCase()
                                    .replace(nomenclatureData.designation.toLowerCase(), '')
                                    .replace(/\s+/g, ' ') // РќРѕСЂРјР°Р»РёР·СѓРµРј РјРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Рµ РїСЂРѕР±РµР»С‹ РІ РѕРґРёРЅР°СЂРЅС‹Рµ
                                    .trim();
                                const dbName = foundItem.name.toLowerCase()
                                    .replace(/\s+/g, ' ') // РќРѕСЂРјР°Р»РёР·СѓРµРј РјРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Рµ РїСЂРѕР±РµР»С‹ РІ РѕРґРёРЅР°СЂРЅС‹Рµ
                                    .trim();



                                // Р•СЃР»Рё РЅР°Р·РІР°РЅРёСЏ СЃРѕРІРїР°РґР°СЋС‚ (РїРѕСЃР»Рµ СѓРґР°Р»РµРЅРёСЏ РѕР±РѕР·РЅР°С‡РµРЅРёСЏ РёР· Excel Рё РЅРѕСЂРјР°Р»РёР·Р°С†РёРё РїСЂРѕР±РµР»РѕРІ)
                                if (excelNameWithoutDesignation === dbName) {
                                    existingItem = foundItem;
                                }
                            }
                        }
                    }

                    // РџР РРћР РРўР•Рў 2: Р•СЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ РїРѕ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ, РёС‰РµРј РїРѕ Р°СЂС‚РёРєСѓР»Сѓ (С‚РѕР»СЊРєРѕ РµСЃР»Рё Р°СЂС‚РёРєСѓР» РЅРµ РїСѓСЃС‚РѕР№)
                    if (!existingItem && nomenclatureData.article && nomenclatureData.article.trim() !== '') {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?article=${encodeURIComponent(nomenclatureData.article)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // РџСЂРѕРІРµСЂСЏРµРј С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ РїРѕ Р°СЂС‚РёРєСѓР»Сѓ
                            if (foundItem && foundItem.article && foundItem.article.toLowerCase() === nomenclatureData.article.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }

                    // РџР РРћР РРўР•Рў 3: Р•СЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ РїРѕ Р°СЂС‚РёРєСѓР»Сѓ, РёС‰РµРј РїРѕ РєРѕРґСѓ 1РЎ (С‚РѕР»СЊРєРѕ РµСЃР»Рё РєРѕРґ РЅРµ "РќРµ СѓРєР°Р·Р°РЅ" Рё РЅРµ РїСѓСЃС‚РѕР№)
                    if (!existingItem && nomenclatureData.code1c && nomenclatureData.code1c !== 'РќРµ СѓРєР°Р·Р°РЅ' && nomenclatureData.code1c.trim() !== '') {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?code1c=${encodeURIComponent(nomenclatureData.code1c)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // РџСЂРѕРІРµСЂСЏРµРј С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ РїРѕ РєРѕРґСѓ 1РЎ
                            if (foundItem && foundItem.code1c && foundItem.code1c.toLowerCase() === nomenclatureData.code1c.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }

                    // РџР РРћР РРўР•Рў 4: Р•СЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ РїРѕ РєРѕРґСѓ 1РЎ, РёС‰РµРј РїРѕ РѕР±РѕР·РЅР°С‡РµРЅРёСЋ (С‚РѕР»СЊРєРѕ РµСЃР»Рё РѕР±РѕР·РЅР°С‡РµРЅРёРµ РЅРµ РїСѓСЃС‚РѕРµ)
                    if (!existingItem && nomenclatureData.designation && nomenclatureData.designation.trim() !== '') {
                        const searchResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/find?designation=${encodeURIComponent(nomenclatureData.designation)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (searchResponse.ok) {
                            const foundItem = await searchResponse.json();
                            // РџСЂРѕРІРµСЂСЏРµРј С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ РїРѕ РѕР±РѕР·РЅР°С‡РµРЅРёСЋ
                            if (foundItem && foundItem.designation && foundItem.designation.toLowerCase() === nomenclatureData.designation.toLowerCase()) {
                                existingItem = foundItem;
                            }
                        }
                    }


                    analyzedData.push({
                        ...nomenclatureData,
                        isExisting: !!existingItem,
                        existingItem: existingItem,
                        suggestedItem: suggestedItem || null, // РџСЂРµРґР»РѕР¶РµРЅРёРµ РґР»СЏ РѕР±СЉРµРґРёРЅРµРЅРёСЏ
                        originalData: nomenclatureData
                    });

                    if (existingItem) {
                        existingCount++;
                    } else if (suggestedItem) {
                        // РџСЂРµРґР»РѕР¶РµРЅРёСЏ РґР»СЏ РѕР±СЉРµРґРёРЅРµРЅРёСЏ СЃС‡РёС‚Р°РµРј РєР°Рє РЅРѕРІС‹Рµ, РЅРѕ СЃ РѕСЃРѕР±С‹Рј СЃС‚Р°С‚СѓСЃРѕРј
                        newCount++;
                    } else {
                        newCount++;
                    }

                }

                setPreviewData(analyzedData);
                setImportStats({
                    existing: existingCount,
                    new: newCount,
                    total: analyzedData.length
                });
                setPreviewFilter('all'); // РЎР±СЂР°СЃС‹РІР°РµРј С„РёР»СЊС‚СЂ РїСЂРё РѕС‚РєСЂС‹С‚РёРё

                setShowColumnMapping(false);
                setShowPreviewDialog(true);

        } catch (error) {
            console.error('РћС€РёР±РєР° Р°РЅР°Р»РёР·Р° РґР°РЅРЅС‹С…:', error);
            console.error('РћС€РёР±РєР° РїСЂРё Р°РЅР°Р»РёР·Рµ РґР°РЅРЅС‹С…');
        } finally {
            setLoading(false);
        }
    };

    // Р¤РёР»СЊС‚СЂР°С†РёСЏ РґР°РЅРЅС‹С… РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂР°
    const getFilteredPreviewData = () => {
        switch (previewFilter) {
            case 'existing':
                return previewData.filter(item => item.isExisting);
            case 'new':
                return previewData.filter(item => !item.isExisting);
            default:
                return previewData;
        }
    };

    // РџРѕР»СѓС‡РёС‚СЊ СЂР°Р·Р»РёС‡РёСЏ РјРµР¶РґСѓ РґР°РЅРЅС‹РјРё РёР· Excel Рё Р‘Р”
    const getDifferences = (excelData: any, existingItem: any) => {
        const differences: { field: string, excelValue: any, dbValue: any, label: string }[] = [];
        const fieldLabels: { [key: string]: string } = {
            designation: 'РћР±РѕР·РЅР°С‡РµРЅРёРµ',
            name: 'РќР°РёРјРµРЅРѕРІР°РЅРёРµ',
            article: 'РђСЂС‚РёРєСѓР»',
            code1c: 'РљРѕРґ 1РЎ',
            manufacturer: 'РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ',
            description: 'РћРїРёСЃР°РЅРёРµ',
            price: 'Р¦РµРЅР°',
            group: 'Р“СЂСѓРїРїР°'
        };

        Object.keys(fieldLabels).forEach(field => {
            const excelValue = excelData[field];
            let dbValue = existingItem[field];

            // Р”Р»СЏ РїРѕР»СЏ group РёР·РІР»РµРєР°РµРј name РёР· РѕР±СЉРµРєС‚Р°
            if (field === 'group' && typeof dbValue === 'object' && dbValue !== null) {
                dbValue = dbValue.name || '';
            }

            // РЎСЂР°РІРЅРёРІР°РµРј Р·РЅР°С‡РµРЅРёСЏ (СЃ СѓС‡С‘С‚РѕРј РїСѓСЃС‚С‹С… СЃС‚СЂРѕРє Рё null)
            const excelNormalized = excelValue || '';
            const dbNormalized = dbValue || '';

            if (excelNormalized !== dbNormalized) {
                differences.push({
                    field,
                    excelValue: excelValue || '(РїСѓСЃС‚Рѕ)',
                    dbValue: dbValue || '(РїСѓСЃС‚Рѕ)',
                    label: fieldLabels[field]
                });
            }
        });

        return differences;
    };

    // РћС‚РєСЂС‹С‚СЊ РґРёР°Р»РѕРі СЃСЂР°РІРЅРµРЅРёСЏ РґР»СЏ РїРѕР·РёС†РёРё
    const handleOpenCompareDialog = (item: any) => {
        // Р Р°Р±РѕС‚Р°РµРј СЃ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРј СЌР»РµРјРµРЅС‚РѕРј РёР»Рё РїСЂРµРґР»РѕР¶РµРЅРЅС‹Рј РґР»СЏ РѕР±СЉРµРґРёРЅРµРЅРёСЏ
        const targetItem = item.existingItem || item.suggestedItem;
        if (!targetItem) return;

        const differences = getDifferences(item.originalData, targetItem);

        // РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ РІС‹Р±РёСЂР°РµРј РІСЃРµ РїРѕР»СЏ РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ
        const defaultUpdateFields: { [key: string]: boolean } = {};
        differences.forEach(diff => {
            defaultUpdateFields[diff.field] = true;
        });

        setCompareItem(item);
        setUpdateFields(defaultUpdateFields);
        setShowCompareDialog(true);
    };

    // РџСЂРёРјРµРЅРёС‚СЊ РІС‹Р±СЂР°РЅРЅС‹Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ Рє РїРѕР·РёС†РёРё
    const handleApplyUpdates = () => {
        if (!compareItem) return;

        // РћРїСЂРµРґРµР»СЏРµРј С†РµР»РµРІРѕР№ СЌР»РµРјРµРЅС‚ (СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ РёР»Рё РїСЂРµРґР»РѕР¶РµРЅРЅС‹Р№)
        const targetItem = compareItem.existingItem || compareItem.suggestedItem;

        // РћР±РЅРѕРІР»СЏРµРј РґР°РЅРЅС‹Рµ РїРѕР·РёС†РёРё СЃРѕРіР»Р°СЃРЅРѕ РІС‹Р±СЂР°РЅРЅС‹Рј РїРѕР»СЏРј
        const updatedItem = { ...compareItem };
        Object.keys(updateFields).forEach(field => {
            if (updateFields[field]) {
                updatedItem[field] = compareItem.originalData[field];
            } else {
                updatedItem[field] = targetItem[field];
            }
        });

        // Р•СЃР»Рё СЌС‚Рѕ РѕР±СЉРµРґРёРЅРµРЅРёРµ СЃ РїСЂРµРґР»РѕР¶РµРЅРЅРѕР№ РїРѕР·РёС†РёРµР№, РїРѕРјРµС‡Р°РµРј РєР°Рє СЃСѓС‰РµСЃС‚РІСѓСЋС‰СѓСЋ
        if (compareItem.suggestedItem && !compareItem.existingItem) {
            updatedItem.isExisting = true;
            updatedItem.existingItem = compareItem.suggestedItem;
            updatedItem.suggestedItem = null;
        }

        // РћР±РЅРѕРІР»СЏРµРј РІ РјР°СЃСЃРёРІРµ previewData
        const updatedPreviewData = previewData.map(item =>
            item === compareItem ? { ...updatedItem, needsUpdate: true } : item
        );
        setPreviewData(updatedPreviewData);

        setShowCompareDialog(false);
        setCompareItem(null);
    };

    // РРјРїРѕСЂС‚ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
    const importNomenclature = async (includeNewItems: boolean = true) => {
        try {
            setLoading(true);
            setError(''); // РћС‡РёС‰Р°РµРј РїСЂРµРґС‹РґСѓС‰РёРµ РѕС€РёР±РєРё

            const token = localStorage.getItem('token');
            if (!token) {
                setError('РўРѕРєРµРЅ Р°РІС‚РѕСЂРёР·Р°С†РёРё РЅРµ РЅР°Р№РґРµРЅ');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            // Р¤РёР»СЊС‚СЂСѓРµРј РґР°РЅРЅС‹Рµ РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РІС‹Р±РѕСЂР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            const itemsToImport = includeNewItems
                ? previewData
                : previewData.filter(item => item.isExisting);

            for (const item of itemsToImport) {
                try {
                    // Р•СЃР»Рё РїРѕР·РёС†РёСЏ СЃСѓС‰РµСЃС‚РІСѓРµС‚ Рё С‚СЂРµР±СѓРµС‚ РѕР±РЅРѕРІР»РµРЅРёСЏ
                    if (item.isExisting && item.needsUpdate) {
                        // РћР±РЅРѕРІР»СЏРµРј СЃСѓС‰РµСЃС‚РІСѓСЋС‰СѓСЋ РїРѕР·РёС†РёСЋ
                        const nomenclatureItem: any = {};

                        // Р”РѕР±Р°РІР»СЏРµРј С‚РѕР»СЊРєРѕ РёР·РјРµРЅС‘РЅРЅС‹Рµ РїРѕР»СЏ
                        if (item.designation !== item.existingItem.designation) nomenclatureItem.designation = item.designation;
                        if (item.name !== item.existingItem.name) nomenclatureItem.name = item.name;
                        if (item.article !== item.existingItem.article) nomenclatureItem.article = item.article;
                        if (item.code1c !== item.existingItem.code1c) nomenclatureItem.code1c = item.code1c;
                        if (item.manufacturer !== item.existingItem.manufacturer) nomenclatureItem.manufacturer = item.manufacturer;
                        if (item.description !== item.existingItem.description) nomenclatureItem.description = item.description;
                        if (item.price && parseFloat(item.price) !== item.existingItem.price) {
                            nomenclatureItem.price = parseFloat(item.price);
                        }

                        // РћС‚РїСЂР°РІР»СЏРµРј PUT Р·Р°РїСЂРѕСЃ РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ
                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items/${item.existingItem.id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(nomenclatureItem)
                        });

                        if (response.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                        continue;
                    }

                    // Р•СЃР»Рё РїРѕР·РёС†РёСЏ СЃСѓС‰РµСЃС‚РІСѓРµС‚ Р±РµР· РѕР±РЅРѕРІР»РµРЅРёР№, РїСЂРѕРїСѓСЃРєР°РµРј РµС‘
                    if (item.isExisting) {
                        successCount++;
                        continue;
                    }

                    // РЎРѕР·РґР°С‘Рј РЅРѕРІСѓСЋ РїРѕР·РёС†РёСЋ
                    const nomenclatureItem: any = {
                        name: item.name,
                        type: 'Product', // РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ С‚РёРї "РўРѕРІР°СЂ"
                    };

                    // Р”РѕР±Р°РІР»СЏРµРј РѕРїС†РёРѕРЅР°Р»СЊРЅС‹Рµ РїРѕР»СЏ
                    if (item.designation) nomenclatureItem.designation = item.designation;
                    if (item.article) nomenclatureItem.article = item.article;
                    if (item.code1c) nomenclatureItem.code1c = item.code1c;
                    if (item.manufacturer) nomenclatureItem.manufacturer = item.manufacturer;
                    if (item.description) nomenclatureItem.description = item.description;
                    if (item.unit) nomenclatureItem.unit = item.unit;
                    if (item.price) nomenclatureItem.price = parseFloat(item.price);

                    // РћР±СЂР°Р±РѕС‚РєР° РіСЂСѓРїРїС‹ (РµСЃР»Рё СѓРєР°Р·Р°РЅР°)
                    if (item.group) {
                        // РС‰РµРј РіСЂСѓРїРїСѓ РїРѕ РЅР°Р·РІР°РЅРёСЋ
                        const groupsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (groupsResponse.ok) {
                            const groups = await groupsResponse.json();
                            const foundGroup = groups.find((g: any) =>
                                g.name.toLowerCase() === item.group.toLowerCase()
                            );

                            if (foundGroup) {
                                nomenclatureItem.groupId = foundGroup.id;
                            } else {
                                // РЎРѕР·РґР°С‘Рј РЅРѕРІСѓСЋ РіСЂСѓРїРїСѓ
                                const newGroupResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ name: item.group })
                                });

                                if (newGroupResponse.ok) {
                                    const newGroup = await newGroupResponse.json();
                                    nomenclatureItem.groupId = newGroup.id;
                                }
                            }
                        }
                    }

                    // РЎРѕР·РґР°С‘Рј РїРѕР·РёС†РёСЋ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(nomenclatureItem)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.error('РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ РїРѕР·РёС†РёРё:', await response.text());
                    }

                } catch (error) {
                    errorCount++;
                    console.error('РћС€РёР±РєР° РёРјРїРѕСЂС‚Р° РїРѕР·РёС†РёРё:', error);
                }
            }

            // Р—Р°РєСЂС‹РІР°РµРј РґРёР°Р»РѕРі Рё РѕР±РЅРѕРІР»СЏРµРј РґР°РЅРЅС‹Рµ
            setShowPreviewDialog(false);
            setImportFile(null);
            setExcelData([]);
            setColumnMapping({});
            setPreviewData([]);

            // РџРѕРєР°Р·С‹РІР°РµРј СЂРµР·СѓР»СЊС‚Р°С‚
            alert(`РРјРїРѕСЂС‚ Р·Р°РІРµСЂС€РµРЅ!\nРЈСЃРїРµС€РЅРѕ: ${successCount}\nРћС€РёР±РѕРє: ${errorCount}`);

            // РћР±РЅРѕРІР»СЏРµРј СЃРїРёСЃРѕРє РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
            await fetchNomenclature();

        } catch (error) {
            console.error('РћС€РёР±РєР° РёРјРїРѕСЂС‚Р°:', error);
            console.error('РћС€РёР±РєР° РїСЂРё РёРјРїРѕСЂС‚Рµ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹');
        } finally {
            setLoading(false);
        }
    };

    // Р—Р°РіСЂСѓР·РєР° РіСЂСѓРїРї, РІРёРґРѕРІ, РµРґРёРЅРёС† Рё РїРѕР·РёС†РёР№
    const fetchNomenclature = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ');
                return;
            }

            // Р—Р°РіСЂСѓР¶Р°РµРј РµРґРёРЅРёС†С‹ РёР·РјРµСЂРµРЅРёСЏ
            const unitsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/units`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (unitsResponse.ok) {
                const unitsData = await unitsResponse.json();
                setUnits(unitsData);
            }

            // Р—Р°РіСЂСѓР¶Р°РµРј РІРёРґС‹ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
            const kindsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature-kinds`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (kindsResponse.ok) {
                const kindsData = await kindsResponse.json();
                setKinds(kindsData);
            }

            // Р—Р°РіСЂСѓР¶Р°РµРј РіСЂСѓРїРїС‹
            const groupsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                setGroups(groupsData);
            }

            // Р—Р°РіСЂСѓР¶Р°РµРј РїРѕР·РёС†РёРё
            const itemsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                setItems(itemsData);
            }
        } catch (error) {
            console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNomenclature();
    }, []);


    // РћР±СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ РіСЂСѓРїРї
    const handleOpenGroupDialog = (group?: NomenclatureGroup) => {
        if (group) {
            setEditingGroup(group);
            setGroupForm({
                name: group.name,
                description: group.description || '',
                parentId: group.parentId || ''
            });
        } else {
            setEditingGroup(null);
            setGroupForm({
                name: '',
                description: '',
                parentId: ''
            });
        }
        setOpenGroupDialog(true);
    };

    const handleCloseGroupDialog = () => {
        setOpenGroupDialog(false);
        setEditingGroup(null);
        setGroupForm({
            name: '',
            description: '',
            parentId: ''
        });
    };

    const handleSaveGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ');
                return;
            }

            const url = editingGroup
                ? `${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups/${editingGroup.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/nomenclature/groups`;

            const method = editingGroup ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(groupForm)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchNomenclature();
            handleCloseGroupDialog();
        } catch (error) {
            console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РіСЂСѓРїРїС‹:', error);
        }
    };


    // РћР±СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ РїРѕР·РёС†РёР№
    const handleOpenItemDialog = (item?: NomenclatureItem, groupId?: string) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                groupId: item.groupId || '',
                kindId: item.kindId || '',
                unitId: (item as any).unitId || '',
                type: (item as any).type || 'Product',
                designation: item.designation || '',
                name: item.name,
                article: item.article || '',
                code1c: item.code1c || '',
                manufacturer: item.manufacturer || '',
                description: item.description || '',
                price: item.price?.toString() || ''
            });
        } else {
            setEditingItem(null);
            setItemForm({
                groupId: groupId || '',
                kindId: '',
                unitId: '',
                type: 'Product',
                designation: '',
                name: '',
                article: '',
                code1c: '',
                manufacturer: '',
                description: '',
                price: ''
            });
        }
        setOpenItemDialog(true);
    };

    const handleCloseItemDialog = () => {
        setOpenItemDialog(false);
        setEditingItem(null);
        setItemForm({
            groupId: '',
            kindId: '',
            unitId: '',
            type: 'Product',
            designation: '',
            name: '',
            article: '',
            code1c: '',
            manufacturer: '',
            description: '',
            price: ''
        });
    };

    const handleSaveItem = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ');
                return;
            }

            const url = editingItem
                ? `${import.meta.env.VITE_API_BASE_URL}/nomenclature/items/${editingItem.id}`
                : `${import.meta.env.VITE_API_BASE_URL}/nomenclature/items`;

            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    groupId: itemForm.groupId || undefined,
                    kindId: itemForm.kindId || undefined,
                    unitId: itemForm.unitId || undefined,
                    type: itemForm.type || undefined,
                    designation: itemForm.designation || undefined,
                    name: itemForm.name,
                    article: itemForm.article || undefined,
                    code1c: itemForm.code1c || undefined,
                    manufacturer: itemForm.manufacturer || undefined,
                    description: itemForm.description || undefined,
                    price: itemForm.price ? parseFloat(itemForm.price) : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchNomenclature();
            handleCloseItemDialog();
        } catch (error) {
            console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїРѕР·РёС†РёРё:', error);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ СѓРґР°Р»РёС‚СЊ СЌС‚Сѓ РїРѕР·РёС†РёСЋ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/nomenclature/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `РћС€РёР±РєР°: ${response.status}`;
                alert(errorMessage);
                return;
            }

            await fetchNomenclature();
        } catch (error) {
            console.error('РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ РїРѕР·РёС†РёРё:', error);
            alert('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РїРѕР·РёС†РёСЋ. РџСЂРѕРІРµСЂСЊС‚Рµ РєРѕРЅСЃРѕР»СЊ РґР»СЏ РїРѕРґСЂРѕР±РЅРѕСЃС‚РµР№.');
        }
    };

    // РџРѕР»СѓС‡РµРЅРёРµ РїРѕР·РёС†РёР№ РґР»СЏ РіСЂСѓРїРїС‹
    const getItemsForGroup = (groupId: string) => {
        return items.filter(item => item.groupId === groupId);
    };

    // РџРѕР»СѓС‡РµРЅРёРµ РїРѕР·РёС†РёР№ Р±РµР· РіСЂСѓРїРїС‹
    const getItemsWithoutGroup = () => {
        return items.filter(item => !item.groupId);
    };

    // РџРѕР»СѓС‡РµРЅРёРµ РѕС‚С„РёР»СЊС‚СЂРѕРІР°РЅРЅС‹С… РїРѕР·РёС†РёР№ (РїРѕ РІС‹Р±СЂР°РЅРЅРѕР№ РіСЂСѓРїРїРµ Рё РІРёРґСѓ)
    // РџРѕСЃС‚СЂРѕРµРЅРёРµ РґРµСЂРµРІР° РіСЂСѓРїРї
    const buildGroupTree = (groups: NomenclatureGroup[]): NomenclatureGroupTree[] => {
        const groupMap = new Map<string, NomenclatureGroupTree>();
        const rootGroups: NomenclatureGroupTree[] = [];

        // РЎРѕР·РґР°РµРј РєР°СЂС‚Сѓ РІСЃРµС… РіСЂСѓРїРї СЃ РїСѓСЃС‚С‹РјРё РјР°СЃСЃРёРІР°РјРё РґРµС‚РµР№
        groups.forEach(group => {
            groupMap.set(group.id, { ...group, children: [] });
        });

        // РЎС‚СЂРѕРёРј РґРµСЂРµРІРѕ
        groups.forEach(group => {
            const groupWithChildren = groupMap.get(group.id)!;
            if (group.parentId && groupMap.has(group.parentId)) {
                groupMap.get(group.parentId)!.children.push(groupWithChildren);
            } else {
                rootGroups.push(groupWithChildren);
            }
        });

        return rootGroups;
    };

    // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ СЂР°СЃРєСЂС‹С‚РёСЏ РіСЂСѓРїРїС‹
    const toggleGroupExpand = (groupId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // РћСЃС‚Р°РЅР°РІР»РёРІР°РµРј РІСЃРїР»С‹С‚РёРµ, С‡С‚РѕР±С‹ РЅРµ СЃСЂР°Р±Р°С‚С‹РІР°Р» onClick РЅР° СЃС‚СЂРѕРєРµ
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    // Р¤СѓРЅРєС†РёРё РґР»СЏ РјРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ РіСЂСѓРїРїР°РјРё
    const handleGroupsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setGroupsMenuAnchor(event.currentTarget);
    };

    const handleGroupsMenuClose = () => {
        setGroupsMenuAnchor(null);
    };

    const handleExpandAllGroups = () => {
        const allGroupIds = new Set<string>();
        const collectAllGroupIds = (groupTree: NomenclatureGroupTree[]) => {
            groupTree.forEach(group => {
                allGroupIds.add(group.id);
                if (group.children.length > 0) {
                    collectAllGroupIds(group.children);
                }
            });
        };
        collectAllGroupIds(buildGroupTree(groups));
        setExpandedGroups(allGroupIds);
        handleGroupsMenuClose();
    };

    const handleCollapseAllGroups = () => {
        setExpandedGroups(new Set());
        handleGroupsMenuClose();
    };

    const handleCreateGroup = () => {
        handleOpenGroupDialog();
        handleGroupsMenuClose();
    };

    // Р РµРєСѓСЂСЃРёРІРЅРѕРµ РѕС‚РѕР±СЂР°Р¶РµРЅРёРµ РґРµСЂРµРІР° РіСЂСѓРїРї
    const renderGroupTree = (groupTree: NomenclatureGroupTree[], level = 0) => {
        return groupTree.map((group) => (
            <React.Fragment key={group.id}>
                <TableRow
                    sx={{
                        minHeight: '20px',
                        cursor: 'pointer',
                        backgroundColor: selectedGroupId === group.id ? '#e3f2fd' : 'transparent',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={() => setSelectedGroupId(group.id)}
                    onDoubleClick={() => canEdit() && handleOpenGroupDialog(group)}
                >
                    <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left', paddingLeft: `${8}px` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {group.children.length > 0 && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => toggleGroupExpand(group.id, e)}
                                    sx={{
                                        padding: 0,
                                        width: '16px',
                                        height: '16px',
                                        minWidth: '16px',
                                        '& .MuiSvgIcon-root': { fontSize: '16px' }
                                    }}
                                >
                                    {expandedGroups.has(group.id) ? <MinusBoxIcon /> : <AddBoxIcon />}
                                </IconButton>
                            )}
                            {group.children.length === 0 && <Box sx={{ width: '16px', minWidth: '16px' }} />}
                            <Box sx={{ width: `${level * 24}px`, minWidth: `${level * 24}px` }} />
                            <FolderIcon fontSize="small" sx={{ color: '#ffc107' }} />
                            {group.name}
                        </Box>
                    </TableCell>
                </TableRow>
                {group.children.length > 0 && expandedGroups.has(group.id) && renderGroupTree(group.children, level + 1)}
            </React.Fragment>
        ));
    };

    // Р РµРєСѓСЂСЃРёРІРЅРѕРµ РѕС‚РѕР±СЂР°Р¶РµРЅРёРµ РіСЂСѓРїРї РІ РІС‹РїР°РґР°СЋС‰РµРј СЃРїРёСЃРєРµ
    const renderGroupMenuItems = (groupTree: NomenclatureGroupTree[], level = 0): React.ReactNode[] => {
        const items: React.ReactNode[] = [];

        groupTree.forEach((group) => {
            items.push(
                <MenuItem key={group.id} value={group.id}>
                    {'вЂ” '.repeat(level)}{group.name}
                </MenuItem>
            );

            if (group.children.length > 0) {
                items.push(...renderGroupMenuItems(group.children, level + 1));
            }
        });

        return items;
    };

    // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РІСЃРµС… РґРѕС‡РµСЂРЅРёС… РіСЂСѓРїРї
    const getAllChildGroupIds = (groupId: string): string[] => {
        const childIds: string[] = [];
        const findChildren = (parentId: string) => {
            groups.forEach(group => {
                if (group.parentId === parentId) {
                    childIds.push(group.id);
                    findChildren(group.id); // Р РµРєСѓСЂСЃРёРІРЅРѕ РёС‰РµРј РґРµС‚РµР№ РґРµС‚РµР№
                }
            });
        };
        findChildren(groupId);
        return childIds;
    };

    // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹ РіСЂСѓРїРїС‹ СЃ СѓС‡РµС‚РѕРј РІР»РѕР¶РµРЅРЅС‹С… РіСЂСѓРїРї
    const getItemsForGroupWithNested = (groupId: string) => {
        const allGroupIds = [groupId, ...getAllChildGroupIds(groupId)];
        return items.filter(item => item.groupId && allGroupIds.includes(item.groupId));
    };

    const getFilteredItems = () => {
        let filtered = items;

        // Р•СЃР»Рё Р°РєС‚РёРІРµРЅ СЂРµР¶РёРј "Р“СЂСѓРїРїС‹" - РїСЂРёРјРµРЅСЏРµРј С„РёР»СЊС‚СЂ РїРѕ РіСЂСѓРїРїР°Рј
        if (rightPanelMode === 'groups' && selectedGroupId !== null) {
            if (selectedGroupId === '') {
                filtered = getItemsWithoutGroup();
            } else {
                if (showNestedGroups) {
                    filtered = getItemsForGroupWithNested(selectedGroupId);
                } else {
                    filtered = getItemsForGroup(selectedGroupId);
                }
            }
        }

        // Р•СЃР»Рё Р°РєС‚РёРІРµРЅ СЂРµР¶РёРј "Р’РёРґС‹" - РїСЂРёРјРµРЅСЏРµРј С„РёР»СЊС‚СЂ РїРѕ РІРёРґР°Рј
        if (rightPanelMode === 'kinds' && selectedKindId !== null) {
            if (selectedKindId === '') {
                filtered = filtered.filter(item => !item.kindId);
            } else {
                filtered = filtered.filter(item => item.kindId === selectedKindId);
            }
        }

        return filtered;
    };

    return (
        <Box className="page-container">

            {/* РўСЂРµС…РєРѕР»РѕРЅРѕС‡РЅС‹Р№ layout: СЃР»РµРІР° РЅРѕРјРµРЅРєР»Р°С‚СѓСЂР°, РІ С†РµРЅС‚СЂРµ РіСЂСѓРїРїС‹, СЃРїСЂР°РІР° РІРёРґС‹ */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {loading ? (
                <LinearProgress />
            ) : (
                <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)', width: '100%', overflow: 'hidden', justifyContent: 'space-between' }}>
                    {/* Р›РµРІР°СЏ РєРѕР»РѕРЅРєР° - РўР°Р±Р»РёС†Р° РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹ */}
                    <Box sx={{ flex: '0 0 68%', minWidth: '232px', display: 'flex', flexDirection: 'column' }}>
                        {/* Р—Р°РіРѕР»РѕРІРѕРє Рё РєРЅРѕРїРєРё СѓРїСЂР°РІР»РµРЅРёСЏ */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                                РќРѕРјРµРЅРєР»Р°С‚СѓСЂР°
                            </Typography>
                            {canCreate() && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <VolumeButton
                                        variant="contained"
                                        onClick={() => setOpenImportDialog(true)}
                                        color="green"
                                        startIcon={<UploadIcon />}
                                    >
                                        РРјРїРѕСЂС‚
                                    </VolumeButton>
                                    <VolumeButton
                                        variant="contained"
                                        onClick={() => handleOpenItemDialog()}
                                        color="blue"
                                    >
                                        РЎРѕР·РґР°С‚СЊ
                                    </VolumeButton>
                                </Box>
                            )}
                        </Box>
                        <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
                            <Table sx={{
                                '& .MuiTableCell-root': { border: '1px solid #e0e0e0', padding: '0 4px !important' },
                                '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '14px !important', lineHeight: '0 !important' },
                                '& .MuiTableHead-root .MuiTableRow-root': { height: '30px !important', maxHeight: '30px !important' },
                                '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important', lineHeight: '1.2 !important' },
                                '& .MuiTableBody-root .MuiTableRow-root': { height: 'auto !important', minHeight: '20px !important' },
                                '& .MuiTableHead-root .MuiTypography-root': { fontSize: '14px !important' }
                            }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '14px' }}>в„–</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px', minWidth: '200px' }}>РќР°РёРјРµРЅРѕРІР°РЅРёРµ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>РђСЂС‚РёРєСѓР»</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>РљРѕРґ 1РЎ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '40px', fontSize: '14px' }}>
                                            <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* РћС‚С„РёР»СЊС‚СЂРѕРІР°РЅРЅС‹Рµ РїРѕР·РёС†РёРё */}
                                    {getFilteredItems().map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            sx={{ height: '30px', cursor: 'pointer' }}
                                            onDoubleClick={() => canEdit() && handleOpenItemDialog(item)}
                                        >
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: '12px', minWidth: '200px' }}>
                                                {item.name}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.article || '-'}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.code1c || '-'}</TableCell>
                                            <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: '12px' }}>{item.manufacturer || '-'}</TableCell>
                                            <TableCell sx={{ textAlign: 'center', py: 0.5, width: '40px' }}>
                                                {canDelete() && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        color="error"
                                                        sx={{ minWidth: 'auto', padding: '0 !important' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {getFilteredItems().length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                РќРµС‚ РїРѕР·РёС†РёР№
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* РџСЂР°РІР°СЏ РєРѕР»РѕРЅРєР° - РўР°Р±Р»РёС†Р° РіСЂСѓРїРї */}
                    <Box sx={{ flex: '0 0 30%', minWidth: 0 }}>
                        <TableContainer component={Paper} sx={{ maxHeight: '600px', overflow: 'auto', marginTop: '64px' }}>
                            <Table sx={{
                                '& .MuiTableCell-root': { border: '1px solid #e0e0e0', padding: '0 4px !important' },
                                '& .MuiTableHead-root .MuiTableCell-root': { fontSize: '14px !important', lineHeight: '0 !important' },
                                '& .MuiTableHead-root .MuiTableRow-root': { height: '30px !important', maxHeight: '30px !important' },
                                '& .MuiTableBody-root .MuiTableCell-root': { fontSize: '12px !important', lineHeight: '1.2 !important' },
                                '& .MuiTableBody-root .MuiTableRow-root': { height: '20px !important', maxHeight: '20px !important' },
                                '& .MuiTableHead-root .MuiTypography-root': { fontSize: '14px !important' }
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ padding: '8px 16px', border: '1px solid #e0e0e0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Radio
                                                                checked={rightPanelMode === 'groups'}
                                                                onChange={() => setRightPanelMode('groups')}
                                                                size="small"
                                                                sx={{ padding: '4px' }}
                                                            />
                                                        }
                                                        label="Р“СЂСѓРїРїС‹"
                                                        sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '14px !important' } }}
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Radio
                                                                checked={rightPanelMode === 'kinds'}
                                                                onChange={() => setRightPanelMode('kinds')}
                                                                size="small"
                                                                sx={{ padding: '4px' }}
                                                            />
                                                        }
                                                        label="Р’РёРґС‹"
                                                        sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '14px !important' } }}
                                                    />
                                                </Box>
                                                {rightPanelMode === 'groups' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleGroupsMenuOpen}
                                                        sx={{
                                                            padding: '4px',
                                                            '& .MuiSvgIcon-root': { fontSize: '16px' }
                                                        }}
                                                    >
                                                        <MenuIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rightPanelMode === 'groups' ? (
                                        <>
                                            {/* РљРЅРѕРїРєР° "Р’СЃРµ" РґР»СЏ СЃР±СЂРѕСЃР° С„РёР»СЊС‚СЂР° */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedGroupId === null ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedGroupId(null)}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Р’СЃРµ РіСЂСѓРїРїС‹&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {renderGroupTree(buildGroupTree(groups))}
                                            {/* РљРЅРѕРїРєР° "РќРµС‚ РіСЂСѓРїРїС‹" */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedGroupId === '' ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedGroupId('')}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;РќРµС‚ РіСЂСѓРїРїС‹&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {groups.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                        РќРµС‚ РіСЂСѓРїРї
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* РљРЅРѕРїРєР° "Р’СЃРµ" РґР»СЏ СЃР±СЂРѕСЃР° С„РёР»СЊС‚СЂР° РїРѕ РІРёРґР°Рј */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedKindId === null ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedKindId(null)}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Р’СЃРµ&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {/* РљРЅРѕРїРєР° "Р‘РµР· РІРёРґР°" */}
                                            <TableRow
                                                sx={{
                                                    minHeight: '20px',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedKindId === '' ? '#e3f2fd' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                                }}
                                                onClick={() => setSelectedKindId('')}
                                            >
                                                <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                    <strong>&lt;Р‘РµР· РІРёРґР°&gt;</strong>
                                                </TableCell>
                                            </TableRow>
                                            {kinds.map((kind) => (
                                                <TableRow
                                                    key={kind.id}
                                                    sx={{
                                                        minHeight: '20px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedKindId === kind.id ? '#e3f2fd' : 'transparent',
                                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                                    }}
                                                    onClick={() => setSelectedKindId(kind.id)}
                                                >
                                                    <TableCell colSpan={2} sx={{ py: 0.5, textAlign: 'left' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DescriptionIcon fontSize="small" sx={{ color: '#1976d2' }} />
                                                            {kind.name}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {kinds.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                        РќРµС‚ РІРёРґРѕРІ
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            )}

            {/* Р”РёР°Р»РѕРі СЃРѕР·РґР°РЅРёСЏ/СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ РіСЂСѓРїРїС‹ */}
            <Dialog open={openGroupDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    {editingGroup ? 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РіСЂСѓРїРїСѓ' : 'РЎРѕР·РґР°С‚СЊ РіСЂСѓРїРїСѓ'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="РќР°Р·РІР°РЅРёРµ РіСЂСѓРїРїС‹"
                        fullWidth
                        variant="outlined"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <FormControl margin="dense" fullWidth>
                        <InputLabel shrink>Р РѕРґРёС‚РµР»СЊСЃРєР°СЏ РіСЂСѓРїРїР°</InputLabel>
                        <Select
                            value={groupForm.parentId}
                            onChange={(e) => setGroupForm({ ...groupForm, parentId: e.target.value })}
                            label="Р РѕРґРёС‚РµР»СЊСЃРєР°СЏ РіСЂСѓРїРїР°"
                            notched
                        >
                            <MenuItem value="">Р‘РµР· СЂРѕРґРёС‚РµР»СЊСЃРєРѕР№ РіСЂСѓРїРїС‹</MenuItem>
                            {groups.length > 0 ? renderGroupMenuItems(buildGroupTree(groups.filter(group => group.id !== editingGroup?.id))) : <MenuItem disabled>РќРµС‚ РґРѕСЃС‚СѓРїРЅС‹С… РіСЂСѓРїРї</MenuItem>}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        label="РћРїРёСЃР°РЅРёРµ"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveGroup} color="blue">
                        {editingGroup ? 'РЎРѕС…СЂР°РЅРёС‚СЊ' : 'РЎРѕР·РґР°С‚СЊ'}
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseGroupDialog} color="orange">
                        РћС‚РјРµРЅР°
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Р”РёР°Р»РѕРі СЃРѕР·РґР°РЅРёСЏ/СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ РїРѕР·РёС†РёРё */}
            <Dialog open={openItemDialog} onClose={() => { }} maxWidth="md" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    РљР°СЂС‚РѕС‡РєР° РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
                </DialogTitle>
                <DialogContent>
                    {/* РЎС‚СЂРѕРєР° 1: РћР±РѕР·РЅР°С‡РµРЅРёРµ | РќР°РёРјРµРЅРѕРІР°РЅРёРµ */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="РћР±РѕР·РЅР°С‡РµРЅРёРµ"
                            value={itemForm.designation}
                            onChange={(e) => setItemForm({ ...itemForm, designation: e.target.value })}
                            margin="dense"
                            sx={{ width: '40%' }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            autoFocus
                            label="РќР°РёРјРµРЅРѕРІР°РЅРёРµ"
                            value={itemForm.name}
                            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                            margin="dense"
                            required
                            sx={{ width: '60%' }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* РЎС‚СЂРѕРєР° 2: РћРїРёСЃР°РЅРёРµ */}
                    <TextField
                        fullWidth
                        label="РћРїРёСЃР°РЅРёРµ"
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        margin="dense"
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* РЎС‚СЂРѕРєР° 3: РђСЂС‚РёРєСѓР» | РљРѕРґ 1РЎ | РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="РђСЂС‚РёРєСѓР»"
                            value={itemForm.article}
                            onChange={(e) => setItemForm({ ...itemForm, article: e.target.value })}
                            margin="dense"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="РљРѕРґ 1РЎ"
                            value={itemForm.code1c}
                            onChange={(e) => setItemForm({ ...itemForm, code1c: e.target.value })}
                            margin="dense"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ"
                            value={itemForm.manufacturer}
                            onChange={(e) => setItemForm({ ...itemForm, manufacturer: e.target.value })}
                            margin="dense"
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* РЎС‚СЂРѕРєР° 4: РўРёРї | Р’РёРґ | Р“СЂСѓРїРїР° */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>РўРёРї</InputLabel>
                            <Select
                                value={itemForm.type}
                                onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                                label="РўРёРї"
                                notched
                            >
                                <MenuItem value="Product">РўРѕРІР°СЂ</MenuItem>
                                <MenuItem value="Service">РЈСЃР»СѓРіР°</MenuItem>
                                <MenuItem value="Work">Р Р°Р±РѕС‚Р°</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Р’РёРґ</InputLabel>
                            <Select
                                value={itemForm.kindId}
                                onChange={(e) => setItemForm({ ...itemForm, kindId: e.target.value })}
                                label="Р’РёРґ"
                                notched
                            >
                                <MenuItem value="">РќРµ СѓРєР°Р·Р°РЅ</MenuItem>
                                {kinds.map((kind) => (
                                    <MenuItem key={kind.id} value={kind.id}>
                                        {kind.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Р“СЂСѓРїРїР°</InputLabel>
                            <Select
                                value={itemForm.groupId}
                                onChange={(e) => setItemForm({ ...itemForm, groupId: e.target.value })}
                                label="Р“СЂСѓРїРїР°"
                                notched
                            >
                                <MenuItem value="">Р‘РµР· РіСЂСѓРїРїС‹</MenuItem>
                                {renderGroupMenuItems(buildGroupTree(groups))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* РЎС‚СЂРѕРєР° 5: Р•РґРёРЅРёС†Р° РёР·РјРµСЂРµРЅРёСЏ | Р¦РµРЅР° */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl margin="dense" sx={{ flex: 1 }}>
                            <InputLabel shrink>Р•РґРёРЅРёС†Р° РёР·РјРµСЂРµРЅРёСЏ</InputLabel>
                            <Select
                                value={itemForm.unitId}
                                onChange={(e) => setItemForm({ ...itemForm, unitId: e.target.value })}
                                label="Р•РґРёРЅРёС†Р° РёР·РјРµСЂРµРЅРёСЏ"
                                notched
                            >
                                <MenuItem value="">РќРµ СѓРєР°Р·Р°РЅР°</MenuItem>
                                {units.map((unit) => (
                                    <MenuItem key={unit.id} value={unit.id}>
                                        {unit.code} - {unit.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Р¦РµРЅР° (СЂСѓР±)"
                            type="number"
                            value={itemForm.price}
                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                            margin="dense"
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ flex: 1 }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton onClick={handleSaveItem} color="blue">
                        РЎРѕС…СЂР°РЅРёС‚СЊ
                    </VolumeButton>
                    <VolumeButton onClick={handleCloseItemDialog} color="orange">
                        РћС‚РјРµРЅР°
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Р”РёР°Р»РѕРі РёРјРїРѕСЂС‚Р° */}
            <Dialog open={openImportDialog} onClose={() => { }} maxWidth="sm" fullWidth disableEscapeKeyDown>
                <DialogTitle>
                    РРјРїРѕСЂС‚ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <VolumeButton
                                variant="contained"
                                color="blue"
                                startIcon={<FolderIcon />}
                                disabled={isFileProcessing}
                                onClick={() => {
                                    const input = document.getElementById('file-input') as HTMLInputElement;
                                    input?.click();
                                }}
                            >
                                Р’С‹Р±РµСЂРёС‚Рµ С„Р°Р№Р»
                            </VolumeButton>
                            {isFileProcessing ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        РћР±СЂР°Р±РѕС‚РєР° С„Р°Р№Р»Р°...
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {importFile ? `Р’С‹Р±СЂР°РЅ С„Р°Р№Р»: ${importFile.name}` : 'Р¤Р°Р№Р» РЅРµ РІС‹Р±СЂР°РЅ'}
                                </Typography>
                            )}
                        </Box>
                        <input
                            id="file-input"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setImportFile(file);
                                    setIsFileProcessing(true);
                                    handleFileUpload(file);
                                }
                            }}
                            style={{ display: 'none' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <VolumeButton
                        onClick={() => {
                            if (excelData && excelData.length > 0) {
                                setOpenImportDialog(false);
                                setShowColumnMapping(true);
                            } else {
                                alert('РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ С„Р°Р№Р» РґР»СЏ РёРјРїРѕСЂС‚Р°');
                            }
                        }}
                        color="green"
                        disabled={!importFile}
                    >
                        РћС‚РєСЂС‹С‚СЊ
                    </VolumeButton>
                    <VolumeButton
                        onClick={() => {
                            setOpenImportDialog(false);
                            setImportFile(null);
                            setExcelData([]);
                        }}
                        color="orange"
                    >
                        РћС‚РјРµРЅР°
                    </VolumeButton>
                </DialogActions>
            </Dialog>

            {/* Р”РёР°Р»РѕРі СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРёСЏ РєРѕР»РѕРЅРѕРє */}
            <Dialog
                open={showColumnMapping}
                maxWidth={false}
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '100vw',
                        height: 'calc(100vh - 48px)',
                        margin: 0,
                        marginTop: '48px',
                        borderRadius: 0,
                        maxWidth: 'none',
                        overflow: 'hidden'
                    },
                    '& .MuiDialogContent-root': {
                        overflow: 'hidden !important'
                    },
                    '& .MuiDialogContentText-root': {
                        overflow: 'hidden !important'
                    }
                }}
            >
                <DialogTitle>РЎРѕРїРѕСЃС‚Р°РІР»РµРЅРёРµ РєРѕР»РѕРЅРѕРє Excel</DialogTitle>
                <DialogContent sx={{ overflow: 'hidden' }}>
                    {excelData.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexWrap: 'wrap',
                            alignContent: 'flex-start'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                                width: 'auto',
                                minWidth: `${excelData[0].length * 150}px`
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        РЎРѕРїРѕСЃС‚Р°РІСЊС‚Рµ РєРѕР»РѕРЅРєРё РёР· Excel С„Р°Р№Р»Р° СЃ РїРѕР»СЏРјРё РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <input
                                            type="checkbox"
                                            id="noHeaders"
                                            checked={noHeaders}
                                            onChange={(e) => setNoHeaders(e.target.checked)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <label htmlFor="noHeaders" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                            РўР°Р±Р»РёС†Р° Р±РµР· Р·Р°РіРѕР»РѕРІРєРѕРІ
                                        </label>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        onClick={analyzeImportData}
                                        variant="contained"
                                        disabled={!Object.values(columnMapping).includes('name')}
                                    >
                                        РђРЅР°Р»РёР·РёСЂРѕРІР°С‚СЊ
                                    </Button>
                                    <Button onClick={() => setShowColumnMapping(false)}>
                                        РћС‚РјРµРЅР°
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{ width: 'auto' }}>
                                <Table size="small" sx={{
                                    tableLayout: 'fixed',
                                    width: 'auto',
                                    '& .MuiTableCell-root': {
                                        width: '150px',
                                        maxWidth: '150px',
                                        fontSize: '12px !important'
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
                                        paddingLeft: '4px !important',
                                        paddingRight: '4px !important'
                                    }
                                }}>
                                    <TableBody>
                                        {/* РЎС‚СЂРѕРєР° СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРёСЏ РєРѕР»РѕРЅРѕРє */}
                                        <TableRow>
                                            {excelData[0].map((_: any, index: number) => (
                                                <TableCell key={index} sx={{ textAlign: 'center', padding: '4px !important' }}>
                                                    <FormControl size="small" sx={{ width: '100%', '& .MuiOutlinedInput-root': { height: '32px' }, '& .MuiSelect-select': { padding: '6px 14px', fontSize: '12px' } }}>
                                                        <Select
                                                            value={columnMapping[index.toString()] || ''}
                                                            onChange={(e) => {
                                                                const newMapping = { ...columnMapping };
                                                                Object.keys(newMapping).forEach(key => {
                                                                    if (key === index.toString()) delete newMapping[key];
                                                                });
                                                                if (e.target.value) {
                                                                    Object.keys(newMapping).forEach(key => {
                                                                        if (newMapping[key] === e.target.value) delete newMapping[key];
                                                                    });
                                                                    newMapping[index.toString()] = e.target.value;
                                                                }
                                                                setColumnMapping(newMapping);
                                                            }}
                                                            displayEmpty
                                                            sx={{ '& .MuiSelect-select': { fontSize: '12px' } }}
                                                        >
                                                            <MenuItem value="" sx={{ fontSize: '12px' }}>РќРµ РІС‹Р±СЂР°РЅРѕ</MenuItem>
                                                            <MenuItem value="designation" sx={{ fontSize: '12px' }}>РћР±РѕР·РЅР°С‡РµРЅРёРµ</MenuItem>
                                                            <MenuItem value="name" sx={{ fontSize: '12px' }}>РќР°РёРјРµРЅРѕРІР°РЅРёРµ</MenuItem>
                                                            <MenuItem value="article" sx={{ fontSize: '12px' }}>РђСЂС‚РёРєСѓР»</MenuItem>
                                                            <MenuItem value="code1c" sx={{ fontSize: '12px' }}>РљРѕРґ 1РЎ</MenuItem>
                                                            <MenuItem value="group" sx={{ fontSize: '12px' }}>Р“СЂСѓРїРїР°</MenuItem>
                                                            <MenuItem value="manufacturer" sx={{ fontSize: '12px' }}>РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ</MenuItem>
                                                            <MenuItem value="description" sx={{ fontSize: '12px' }}>РћРїРёСЃР°РЅРёРµ</MenuItem>
                                                            <MenuItem value="unit" sx={{ fontSize: '12px' }}>Р•Рґ. РёР·РјРµСЂРµРЅРёСЏ</MenuItem>
                                                            <MenuItem value="price" sx={{ fontSize: '12px' }}>Р¦РµРЅР°</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {/* Р—Р°РіРѕР»РѕРІРєРё Excel */}
                                        <TableRow>
                                            {excelData[0].map((_: any, index: number) => (
                                                <TableCell key={index} sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '12px !important',
                                                    textAlign: 'center',
                                                    padding: '4px !important',
                                                    border: '2px solid #333',
                                                    borderTop: '2px solid #333',
                                                    borderLeft: '2px solid #333',
                                                    borderRight: index === excelData[0].length - 1 ? '2px solid #333' : '1px solid #e0e0e0',
                                                    borderBottom: '2px solid #333'
                                                }}>
                                                    {excelData[0][index] || `РљРѕР»РѕРЅРєР° ${index + 1}`}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {/* РџСЂРµРІСЊСЋ РґР°РЅРЅС‹С… */}
                                        {excelData.length > 1 && excelData.slice(1, 4).map((row: any[], rowIndex: number) => (
                                            <TableRow key={rowIndex}>
                                                {row.map((cell: any, cellIndex: number) => (
                                                    <TableCell key={cellIndex} sx={{
                                                        fontSize: '12px !important',
                                                        textAlign: 'center',
                                                        padding: '4px !important',
                                                        border: '1px solid #e0e0e0',
                                                        backgroundColor: columnMapping[cellIndex.toString()] ? '#e3f2fd' : 'transparent'
                                                    }}>
                                                        {cell || ''}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Р”РёР°Р»РѕРі РїСЂРµРґРІР°СЂРёС‚РµР»СЊРЅРѕРіРѕ РїСЂРѕСЃРјРѕС‚СЂР° РёРјРїРѕСЂС‚Р° */}
            <Dialog
                open={showPreviewDialog}
                maxWidth="lg"
                fullWidth
                hideBackdrop={true}
                disablePortal={true}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '90vw',
                        height: '80vh',
                        maxWidth: 'none',
                        maxHeight: 'none'
                    }
                }}
            >
                <DialogTitle>
                    РџСЂРµРґРІР°СЂРёС‚РµР»СЊРЅС‹Р№ РїСЂРѕСЃРјРѕС‚СЂ РёРјРїРѕСЂС‚Р° РЅРѕРјРµРЅРєР»Р°С‚СѓСЂС‹
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: previewFilter === 'all' ? 'bold' : 'normal',
                                color: previewFilter === 'all' ? 'primary.main' : 'text.secondary',
                                textDecoration: previewFilter === 'all' ? 'underline' : 'none',
                                '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => setPreviewFilter('all')}
                        >
                            Р’СЃРµРіРѕ РїРѕР·РёС†РёР№: {importStats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">|</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: previewFilter === 'existing' ? 'bold' : 'normal',
                                color: previewFilter === 'existing' ? 'success.main' : 'text.secondary',
                                textDecoration: previewFilter === 'existing' ? 'underline' : 'none',
                                '&:hover': { color: 'success.main' }
                            }}
                            onClick={() => setPreviewFilter('existing')}
                        >
                            РЎСѓС‰РµСЃС‚РІСѓСЋС‰РёС…: {importStats.existing}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">|</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: previewFilter === 'new' ? 'bold' : 'normal',
                                color: previewFilter === 'new' ? 'warning.main' : 'text.secondary',
                                textDecoration: previewFilter === 'new' ? 'underline' : 'none',
                                '&:hover': { color: 'warning.main' }
                            }}
                            onClick={() => setPreviewFilter('new')}
                        >
                            РќРѕРІС‹С…: {importStats.new}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
                            <Table size="small" stickyHeader sx={{
                                '& .MuiTableCell-root': { fontSize: '12px', padding: '4px 8px' }
                            }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РЎС‚Р°С‚СѓСЃ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РћР±РѕР·РЅР°С‡РµРЅРёРµ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РќР°РёРјРµРЅРѕРІР°РЅРёРµ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РђСЂС‚РёРєСѓР»</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РљРѕРґ 1РЎ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Р”РµР№СЃС‚РІРёСЏ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getFilteredPreviewData().map((item, index) => {
                                        const differences = item.existingItem ? getDifferences(item.originalData, item.existingItem) : [];
                                        const hasDifferences = differences.length > 0;

                                        return (
                                            <TableRow key={index} sx={{
                                                backgroundColor: item.needsUpdate ? '#fff9c4' : 'inherit'
                                            }}>
                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            item.needsUpdate ? 'РћР±РЅРѕРІРёС‚СЃСЏ' :
                                                                item.isExisting ? 'РЎСѓС‰РµСЃС‚РІСѓСЋС‰Р°СЏ' :
                                                                    item.suggestedItem ? 'РќРѕРІР°СЏ (РµСЃС‚СЊ РїРѕС…РѕР¶Р°СЏ)' : 'РќРѕРІР°СЏ'
                                                        }
                                                        color={
                                                            item.needsUpdate ? 'info' :
                                                                item.isExisting ? 'success' :
                                                                    item.suggestedItem ? 'secondary' : 'warning'
                                                        }
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                    {hasDifferences && !item.needsUpdate && (
                                                        <Chip
                                                            label={`${differences.length} РѕС‚Р»РёС‡РёР№`}
                                                            color="warning"
                                                            size="small"
                                                            sx={{ ml: 0.5 }}
                                                        />
                                                    )}
                                                    {item.suggestedItem && !item.isExisting && (
                                                        <Chip
                                                            label="РџСЂРµРґР»РѕР¶РёС‚СЊ РѕР±СЉРµРґРёРЅРµРЅРёРµ"
                                                            color="secondary"
                                                            size="small"
                                                            sx={{ ml: 0.5 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.designation || '-'}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>{item.article || '-'}</TableCell>
                                                <TableCell>{item.code1c || '-'}</TableCell>
                                                <TableCell>{item.manufacturer || '-'}</TableCell>
                                                <TableCell>
                                                    {item.isExisting && hasDifferences && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleOpenCompareDialog(item)}
                                                        >
                                                            {item.needsUpdate ? 'РР·РјРµРЅРёС‚СЊ' : 'РЎСЂР°РІРЅРёС‚СЊ'}
                                                        </Button>
                                                    )}
                                                    {item.suggestedItem && !item.isExisting && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="secondary"
                                                            onClick={() => handleOpenCompareDialog(item)}
                                                        >
                                                            РћР±СЉРµРґРёРЅРёС‚СЊ СЃ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Р—РµР»РµРЅС‹Рµ РїРѕР·РёС†РёРё СЃСѓС‰РµСЃС‚РІСѓСЋС‚ РІ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂРµ,
                            Р¶РµР»С‚С‹Рµ Р±СѓРґСѓС‚ СЃРѕР·РґР°РЅС‹ РєР°Рє РЅРѕРІС‹Рµ РїРѕР·РёС†РёРё
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={() => setShowPreviewDialog(false)}>
                            РћС‚РјРµРЅР°
                        </Button>
                        <Button
                            onClick={() => importNomenclature(true)}
                            variant="contained"
                            color="primary"
                        >
                            РРјРїРѕСЂС‚РёСЂРѕРІР°С‚СЊ РІСЃРµ
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Р”РёР°Р»РѕРі РґРµС‚Р°Р»СЊРЅРѕРіРѕ СЃСЂР°РІРЅРµРЅРёСЏ */}
            <Dialog
                open={showCompareDialog}
                onClose={() => { }}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle>
                    {compareItem?.suggestedItem && !compareItem?.existingItem ?
                        `РџСЂРµРґР»РѕР¶РµРЅРёРµ РѕР±СЉРµРґРёРЅРµРЅРёСЏ: ${compareItem?.name}` :
                        `РЎСЂР°РІРЅРµРЅРёРµ РґР°РЅРЅС‹С…: ${compareItem?.name}`
                    }
                </DialogTitle>
                <DialogContent>
                    {compareItem && (compareItem.existingItem || compareItem.suggestedItem) && (
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>РџРѕР»Рµ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Р’ Excel</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Р’ Р±Р°Р·Рµ РґР°РЅРЅС‹С…</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>РћР±РЅРѕРІРёС‚СЊ?</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getDifferences(compareItem.originalData, compareItem.existingItem || compareItem.suggestedItem).map((diff) => (
                                        <TableRow key={diff.field}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{diff.label}</TableCell>
                                            <TableCell sx={{
                                                backgroundColor: '#e3f2fd',
                                                fontWeight: 'bold'
                                            }}>
                                                {typeof diff.excelValue === 'object' && diff.excelValue !== null
                                                    ? JSON.stringify(diff.excelValue)
                                                    : diff.excelValue}
                                            </TableCell>
                                            <TableCell sx={{
                                                backgroundColor: '#f5f5f5'
                                            }}>
                                                {typeof diff.dbValue === 'object' && diff.dbValue !== null
                                                    ? JSON.stringify(diff.dbValue)
                                                    : diff.dbValue}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Checkbox
                                                    checked={updateFields[diff.field] || false}
                                                    onChange={(e) => setUpdateFields({
                                                        ...updateFields,
                                                        [diff.field]: e.target.checked
                                                    })}
                                                    color="primary"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff9c4', borderRadius: 1 }}>
                        <Typography variant="body2">
                            <strong>РџРѕРґСЃРєР°Р·РєР°:</strong>
                            {compareItem?.suggestedItem && !compareItem?.existingItem ?
                                ' Р’С‹Р±РµСЂРёС‚Рµ РїРѕР»СЏ РґР»СЏ РѕР±СЉРµРґРёРЅРµРЅРёСЏ СЃ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ РїРѕР·РёС†РёРµР№. РџРѕР»СЏ Р±РµР· РіР°Р»РѕС‡РєРё РѕСЃС‚Р°РЅСѓС‚СЃСЏ РёР· СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ РїРѕР·РёС†РёРё.' :
                                ' Р’С‹Р±РµСЂРёС‚Рµ РїРѕР»СЏ, РєРѕС‚РѕСЂС‹Рµ РЅСѓР¶РЅРѕ РѕР±РЅРѕРІРёС‚СЊ РёР· Excel. РџРѕР»СЏ Р±РµР· РіР°Р»РѕС‡РєРё РѕСЃС‚Р°РЅСѓС‚СЃСЏ Р±РµР· РёР·РјРµРЅРµРЅРёР№.'
                            }
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCompareDialog(false)}>
                        РћС‚РјРµРЅР°
                    </Button>
                    <Button
                        onClick={handleApplyUpdates}
                        variant="contained"
                        color="primary"
                    >
                        {compareItem?.suggestedItem && !compareItem?.existingItem ?
                            'РћР±СЉРµРґРёРЅРёС‚СЊ РїРѕР·РёС†РёРё' :
                            'РџСЂРёРјРµРЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ'
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* РњРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ РіСЂСѓРїРїР°РјРё */}
            <Menu
                anchorEl={groupsMenuAnchor}
                open={Boolean(groupsMenuAnchor)}
                onClose={handleGroupsMenuClose}
                PaperProps={{
                    sx: {
                        minWidth: '280px',
                        '& .MuiListItemText-root .MuiTypography-root': {
                            fontSize: '12px !important'
                        },
                        '& .MuiCheckbox-root': {
                            padding: '4px !important',
                            '& .MuiSvgIcon-root': {
                                fontSize: '18px !important'
                            }
                        },
                        '& .MuiListItemButton-root': {
                            padding: '0 8px !important'
                        },
                        '& .MuiListItemIcon-root': {
                            minWidth: '36px !important'
                        }
                    }
                }}
            >
                {/* РљРЅРѕРїРєР° РЎРѕР·РґР°С‚СЊ */}
                <ListItemButton onClick={handleCreateGroup}>
                    <ListItemIcon>
                        <Box sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: '#ffc107',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '5px'
                        }}>
                            <AddIcon sx={{ color: 'white', fontSize: 16 }} />
                        </Box>
                    </ListItemIcon>
                    <ListItemText primary="РЎРѕР·РґР°С‚СЊ" />
                </ListItemButton>

                {/* Р§РµРєР±РѕРєСЃ: РџРѕРєР°Р·С‹РІР°С‚СЊ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂСѓ РІР»РѕР¶РµРЅРЅС‹С… РіСЂСѓРїРї */}
                <ListItemButton onClick={() => setShowNestedGroups(!showNestedGroups)}>
                    <ListItemIcon>
                        <Checkbox
                            checked={showNestedGroups}
                            onChange={() => setShowNestedGroups(!showNestedGroups)}
                            size="small"
                        />
                    </ListItemIcon>
                    <ListItemText primary="РџРѕРєР°Р·С‹РІР°С‚СЊ РЅРѕРјРµРЅРєР»Р°С‚СѓСЂСѓ РІР»РѕР¶РµРЅРЅС‹С… РіСЂСѓРїРї" />
                </ListItemButton>

                {/* Р§РµРєР±РѕРєСЃ: РЎРѕСЂС‚РёСЂРѕРІР°С‚СЊ РїРѕ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ */}
                <ListItemButton onClick={() => setSortByName(!sortByName)}>
                    <ListItemIcon>
                        <Checkbox
                            checked={sortByName}
                            onChange={() => setSortByName(!sortByName)}
                            size="small"
                        />
                    </ListItemIcon>
                    <ListItemText primary="РЎРѕСЂС‚РёСЂРѕРІР°С‚СЊ РїРѕ РЅР°РёРјРµРЅРѕРІР°РЅРёСЋ" />
                </ListItemButton>

                {/* РљРЅРѕРїРєР° Р’РІРµСЂС… */}
                <ListItemButton onClick={handleGroupsMenuClose}>
                    <ListItemIcon>
                        <ArrowUpIcon sx={{ color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Р’РІРµСЂС…" />
                </ListItemButton>

                {/* РљРЅРѕРїРєР° Р’РЅРёР· */}
                <ListItemButton onClick={handleGroupsMenuClose}>
                    <ListItemIcon>
                        <ArrowDownIcon sx={{ color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Р’РЅРёР·" />
                </ListItemButton>

                {/* РљРЅРѕРїРєР° РЎРІРµСЂРЅСѓС‚СЊ РІСЃРµ */}
                <ListItemButton onClick={handleCollapseAllGroups}>
                    <ListItemIcon>
                        <SortIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="РЎРІРµСЂРЅСѓС‚СЊ РІСЃРµ" />
                </ListItemButton>

                {/* РљРЅРѕРїРєР° Р Р°Р·РІРµСЂРЅСѓС‚СЊ РІСЃРµ */}
                <ListItemButton onClick={handleExpandAllGroups}>
                    <ListItemIcon>
                        <SortIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Р Р°Р·РІРµСЂРЅСѓС‚СЊ РІСЃРµ" />
                </ListItemButton>
            </Menu>
        </Box>
    );


export default NomenclaturePage;
};
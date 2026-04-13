from ninja import Router
from typing import List
from ninja.errors import HttpError
import json
from ..domain.entities import (
    ModuleSchema, ModuledDetailSchema, LessonSchema,
    LessonCreateSchema, LessonUpdateSchema, ModuleUpdateSchema, LessonReorderSchema,
    LessonValidateRequest
)
from ..domain.services import EducationService
from ninja_jwt.authentication import JWTAuth

router = Router()

def _is_admin(request):
    try:
        authenticator = JWTAuth()
        user = authenticator(request)
        return user and getattr(user, 'is_staff', False)
    except Exception:
        return False

@router.get("/modules", response=List[ModuleSchema])
def list_modules(request):
    return EducationService.get_all_modules()

@router.get("/modules/{slug}", response=ModuledDetailSchema)
def get_module(request, slug: str):
    module = EducationService.get_module_by_slug(slug)
    if not _is_admin(request):
        for lesson in module.lessons.all():
            lesson.correct_answer = None
    return module

@router.put("/modules/{slug}", response=ModuleSchema, auth=JWTAuth())
def update_module(request, slug: str, data: ModuleUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.update_module(slug, data)


@router.get("/modules/{slug}/lessons", response=List[LessonSchema])
def get_module_lessons(request, slug: str):
    lessons = list(EducationService.get_lessons_by_module(slug))
    if not _is_admin(request):
        for lesson in lessons:
            lesson.correct_answer = None
    return lessons

@router.get("/lessons/{slug}", response=LessonSchema)
def get_lesson(request, slug: str):
    lesson = EducationService.get_lesson(slug)
    if not _is_admin(request):
        lesson.correct_answer = None
    return lesson

@router.post("/lessons", response=LessonSchema, auth=JWTAuth())
def create_lesson(request, data: LessonCreateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.create_lesson(data)


@router.put("/lessons/{slug}", response=LessonSchema, auth=JWTAuth())
def update_lesson(request, slug: str, data: LessonUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.update_lesson(slug, data)


@router.delete("/lessons/{slug}", auth=JWTAuth())
def delete_lesson(request, slug: str):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.delete_lesson(slug)


@router.post("/modules/{slug}/reorder", response=List[LessonSchema], auth=JWTAuth())
def reorder_lessons(request, slug: str, data: LessonReorderSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.reorder_lessons(slug, data.lesson_ids)


@router.get("/lessons/{slug}/validation-config")
def get_lesson_validation_config(request, slug: str):
    """Get lesson validation configuration for frontend validation"""
    lesson = EducationService.get_lesson(slug)
    if not lesson:
        raise HttpError(404, "Lesson not found")
    
    # Return validation config (including reference code) for frontend validation
    config = {"mode": "code", "code": ""}
    try:
        if lesson.correct_answer and lesson.correct_answer.strip().startswith('{'):
            config = json.loads(lesson.correct_answer)
        else:
            config = {"mode": "code", "code": lesson.correct_answer or ""}
    except json.JSONDecodeError:
        config = {"mode": "code", "code": lesson.correct_answer or ""}
    
    data = {
        "config": config,
        "lessonType": lesson.type,
        "lessonSlug": slug
    }
    
    import base64
    json_str = json.dumps(data).encode('utf-8')
    key = b'SysAnalytiqSecretKey2026'
    obfuscated = bytearray(len(json_str))
    for i, b in enumerate(json_str):
        obfuscated[i] = b ^ key[i % len(key)]
    
    return {"payload": base64.b64encode(obfuscated).decode('utf-8')}


@router.post("/lessons/{slug}/validate")
def validate_lesson_solution(request, slug: str, data: LessonValidateRequest):
    lesson = EducationService.get_lesson(slug)
    if not lesson:
        raise HttpError(404, "Lesson not found")
    
    config = {"mode": "code", "code": ""}
    try:
        if lesson.correct_answer and lesson.correct_answer.strip().startswith('{'):
            config = json.loads(lesson.correct_answer)
        else:
            config = {"mode": "code", "code": lesson.correct_answer or ""}
    except json.JSONDecodeError:
        config = {"mode": "code", "code": lesson.correct_answer or ""}

    if lesson.type == 'bpmn':
        return _validate_bpmn_solution(data.code, config)
    elif lesson.type == 'sql':
        return _validate_sql_solution(data.code, config)
    elif lesson.type == 'erd':
        return _validate_erd_solution(data.code, config)
    elif lesson.type == 'plantuml':
        return _validate_plantuml_solution(data.code, config)
    elif lesson.type == 'swagger':
        return _validate_swagger_solution(data.code, config)
    
    return {"valid": True}


def _validate_erd_solution(student_code: str, config: dict) -> dict:
    """Basic ERD validation on backend"""
    try:
        # Only check if code is empty - detailed validation on frontend
        if not student_code.strip():
            return {"valid": False, "error": "Code is empty"}
        
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}




def _validate_sql_solution(student_code: str, config: dict) -> dict:
    """Basic SQL validation on backend"""
    try:
        # Only check if code is empty - detailed validation on frontend
        if not student_code.strip():
            return {"valid": False, "error": "SQL code is empty"}
        
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}


import xml.etree.ElementTree as ET
import re

def _validate_bpmn_solution(student_code: str, config: dict) -> dict:
    """Detailed BPMN validation on backend"""
    if not student_code.strip():
        return {"valid": False, "error": "BPMN code is empty"}
        
    try:
        root = ET.fromstring(student_code)
    except ET.ParseError:
        return {"valid": False, "error": "Некорректный формат BPMN диаграммы"}

    def get_elements_by_tag(doc, tag_name):
        return [el for el in doc.iter() if el.tag.endswith("}" + tag_name) or el.tag == tag_name]

    tasks = (len(get_elements_by_tag(root, "task")) + 
             len(get_elements_by_tag(root, "userTask")) +
             len(get_elements_by_tag(root, "serviceTask")) +
             len(get_elements_by_tag(root, "sendTask")) +
             len(get_elements_by_tag(root, "receiveTask")))
             
    startEvents = len(get_elements_by_tag(root, "startEvent"))
    endEvents = len(get_elements_by_tag(root, "endEvent"))
    
    gateways = (len(get_elements_by_tag(root, "exclusiveGateway")) +
                len(get_elements_by_tag(root, "inclusiveGateway")) +
                len(get_elements_by_tag(root, "parallelGateway")))
                
    flows = len(get_elements_by_tag(root, "sequenceFlow"))
    lanes = len(get_elements_by_tag(root, "lane"))
    participants = len(get_elements_by_tag(root, "participant"))

    if startEvents == 0:
        return {"valid": False, "error": "Диаграмма должна содержать начальное событие (Start Event)"}
    if endEvents == 0:
        return {"valid": False, "error": "Диаграмма должна содержать конечное событие (End Event)"}
    if lanes == 0 and participants == 0:
        return {"valid": False, "error": "Диаграмма должна содержать хотя бы один пул или дорожку (Pool/Lane)"}
    if flows == 0 and (tasks + gateways + startEvents + endEvents) > 1:
        return {"valid": False, "error": "Элементы диаграммы должны быть соединены потоками управления (Sequence Flow)"}

    sequence_flows = get_elements_by_tag(root, "sequenceFlow")
    source_refs = set(f.attrib.get("sourceRef") for f in sequence_flows if f.attrib.get("sourceRef"))
    target_refs = set(f.attrib.get("targetRef") for f in sequence_flows if f.attrib.get("targetRef"))
    
    for el in get_elements_by_tag(root, "startEvent"):
        if el.attrib.get("id", "") not in source_refs:
            return {"valid": False, "error": "Начальное событие должно иметь исходящий поток управления"}
            
    for el in get_elements_by_tag(root, "endEvent"):
        if el.attrib.get("id", "") not in target_refs:
            return {"valid": False, "error": "Конечное событие должно иметь входящий поток управления"}

    flow_elements = []
    for tag in ["task", "userTask", "serviceTask", "sendTask", "receiveTask", "exclusiveGateway", "inclusiveGateway", "parallelGateway"]:
        flow_elements.extend(get_elements_by_tag(root, tag))
        
    for el in flow_elements:
        el_id = el.attrib.get("id", "")
        if el_id not in source_refs and el_id not in target_refs:
            name = el.attrib.get("name") or el_id
            return {"valid": False, "error": f"Элемент «{name}» не соединён ни одним потоком управления"}

    def check_value(val: float, expected: float, operator: str) -> bool:
        if operator == '>': return val > expected
        if operator == '<': return val < expected
        if operator == '>=': return val >= expected
        if operator == '<=': return val <= expected
        if operator == '!=': return val != expected
        return val == expected
        
    def get_op_text(op):
        mapping = {'>': 'больше', '<': 'меньше', '>=': 'не меньше', '<=': 'не больше', '!=': 'не равно', '=': 'ровно'}
        return mapping.get(op, '')

    mode = config.get("mode")
    if mode == "manual":
        for check in config.get("checks", []):
            try:
                expected = float(check.get("value", 0))
            except ValueError:
                expected = 0
            operator = check.get("operator", "=")
            op_text = get_op_text(operator)
            suffix = f" ({op_text})" if op_text else ""
            c_type = check.get("type", "")
            if c_type == "element_count":
                element = check.get("element", "")
                count = 0
                if element == "startEvent": count = startEvents
                elif element == "endEvent": count = endEvents
                elif element == "task": count = tasks
                elif element == "gateway": count = gateways
                elif element == "lane": count = lanes
                elif element == "participant": count = participants
                else:
                    count = len(re.findall(f"<bpmn:{element}", student_code))
                if not check_value(count, expected, operator):
                    return {"valid": False, "error": f"Ожидалось элементов {element}: {check.get('value')}{suffix}, найдено: {count}"}
            elif c_type in ["connection_count", "edge_count"]:
                if not check_value(flows, expected, operator):
                    return {"valid": False, "error": f"Ожидалось связей: {check.get('value')}{suffix}, найдено: {flows}"}
            elif c_type == "node_count":
                nc = tasks + startEvents + endEvents + gateways
                if not check_value(nc, expected, operator):
                    return {"valid": False, "error": f"Ожидалось узлов: {check.get('value')}{suffix}, найдено: {nc}"}
            elif c_type in ["node_exists", "contains_text"]:
                target = check.get("target", "")
                if target not in student_code:
                    return {"valid": False, "error": f"Диаграмма должна содержать элемент: \"{target}\""}
            elif c_type == "lane_count":
                lc = lanes if lanes > 0 else participants
                if not check_value(lc, expected, operator):
                    return {"valid": False, "error": f"Ожидалось дорожек: {check.get('value')}{suffix}, найдено: {lc}"}
            elif c_type == "gateway_count":
                if not check_value(gateways, expected, operator):
                    return {"valid": False, "error": f"Ожидалось шлюзов: {check.get('value')}{suffix}, найдено: {gateways}"}

    elif config.get("code"):
        bpmn_labels = {
            'participant': 'пул', 'lane': 'дорожка', 'task': 'задача', 'userTask': 'задача',
            'serviceTask': 'задача', 'sendTask': 'задача', 'receiveTask': 'задача',
            'startEvent': 'начальное событие', 'endEvent': 'конечное событие',
            'exclusiveGateway': 'шлюз', 'inclusiveGateway': 'шлюз', 'parallelGateway': 'шлюз'
        }
        
        try:
            ref_root = ET.fromstring(config.get("code", ""))
            
            def parse_bpmn_stats(r):
                t = (len(get_elements_by_tag(r, "task")) + 
                     len(get_elements_by_tag(r, "userTask")) +
                     len(get_elements_by_tag(r, "serviceTask")) +
                     len(get_elements_by_tag(r, "sendTask")) +
                     len(get_elements_by_tag(r, "receiveTask")))
                se = len(get_elements_by_tag(r, "startEvent"))
                ee = len(get_elements_by_tag(r, "endEvent"))
                g = (len(get_elements_by_tag(r, "exclusiveGateway")) +
                     len(get_elements_by_tag(r, "inclusiveGateway")) +
                     len(get_elements_by_tag(r, "parallelGateway")))
                f = len(get_elements_by_tag(r, "sequenceFlow"))
                la = len(get_elements_by_tag(r, "lane"))
                pa = len(get_elements_by_tag(r, "participant"))
                
                named = []
                for el in r.iter():
                    if el.attrib.get('name'):
                        local_name = el.tag.split("}")[-1] if "}" in el.tag else el.tag
                        named.append({"name": el.attrib['name'], "type": local_name})
                        
                return {"nodeCount": t+se+ee+g, "edgeCount": f, "laneCount": la if la>0 else pa, "gatewayCount": g, "namedElements": named}
            
            ref_stats = parse_bpmn_stats(ref_root)
            
            if config.get("checkNodeCount"):
                s_nc = tasks + startEvents + endEvents + gateways
                if s_nc != ref_stats["nodeCount"]:
                    return {"valid": False, "error": f"Ожидалось узлов: {ref_stats['nodeCount']}, найдено: {s_nc}"}
            if config.get("checkEdgeCount"):
                if flows != ref_stats["edgeCount"]:
                    return {"valid": False, "error": f"Ожидалось связей: {ref_stats['edgeCount']}, найдено: {flows}"}
            if config.get("checkLaneCount"):
                s_lc = lanes if lanes > 0 else participants
                if s_lc != ref_stats["laneCount"]:
                    return {"valid": False, "error": f"Ожидалось дорожек: {ref_stats['laneCount']}, найдено: {s_lc}"}
            if config.get("checkGatewayCount"):
                if gateways != ref_stats["gatewayCount"]:
                    return {"valid": False, "error": f"Ожидалось шлюзов: {ref_stats['gatewayCount']}, найдено: {gateways}"}
            if config.get("checkNodeNames"):
                student_names_lower = []
                for el in root.iter():
                    name = el.attrib.get("name")
                    if name:
                        student_names_lower.append(name.lower())
                
                missing = [el for el in ref_stats["namedElements"] if el["name"].lower() not in student_names_lower]
                if missing:
                    items = []
                    for el in missing[:3]:
                        label = bpmn_labels.get(el["type"], "элемент")
                        items.append(f"{label} «{el['name']}»")
                    suffix = "..." if len(missing) > 3 else ""
                    return {"valid": False, "error": f"Отсутствуют: {', '.join(items)}{suffix}"}
        except ET.ParseError:
            pass # Invalid config reference code

    return {"valid": True}


def _validate_plantuml_solution(student_code: str, config: dict) -> dict:
    """Basic PlantUML validation on backend"""
    try:
        # Only check if code is empty - detailed validation on frontend
        if not student_code.strip():
            return {"valid": False, "error": "PlantUML code is empty"}
        
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}


def _validate_swagger_solution(student_code: str, config: dict) -> dict:
    """Basic Swagger/OpenAPI validation on backend"""
    try:
        # Only check if code is empty - detailed validation on frontend
        if not student_code.strip():
            return {"valid": False, "error": "Swagger/OpenAPI code is empty"}
        
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}

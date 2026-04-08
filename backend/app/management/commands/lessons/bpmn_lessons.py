BPMN_LESSONS = [
    {
        "number": 1,
        "title": "Введение в BPMN",
        "slug": "bpmn-intro",
        "type": "theory",
        "content": """# Введение в BPMN

**BPMN** (Business Process Model and Notation) — стандарт для моделирования бизнес-процессов.

## Зачем нужен BPMN?

- Визуализация бизнес-процессов
- Коммуникация между бизнесом и IT
- Оптимизация и автоматизация процессов
- Документирование workflow

## Основные элементы

### 1. Событие (Event)

| Элемент | Описание |
|---------|----------|
| **Start Event** | Начало процесса |
| **End Event** | Завершение процесса |
| **Intermediate Event** | Промежуточное событие |

### 2. Задача (Task)

Единица работы — действие, которое выполняет участник.

### 3. Шлюз (Gateway)

| Шлюз | Описание |
|------|----------|
| **Exclusive (XOR)** | Только одна ветвь |
| **Parallel (AND)** | Все ветви параллельно |
| **Inclusive (OR)** | Одна или несколько ветвей |

### 4. Поток управления (Sequence Flow)

Стрелки, соединяющие элементы и задающие порядок выполнения.

### 5. Пулы и дорожки (Pools & Lanes)

- **Пул** — участник процесса (организация, система)
- **Дорожка** — роль внутри пула

> **Правило:** Каждый процесс должен иметь хотя бы один Start Event и один End Event, соединённые потоками.
""",
    },
    {
        "number": 2,
        "title": "Простой бизнес-процесс",
        "slug": "bpmn-simple",
        "type": "practice",
        "content": """# Практика: Простой бизнес-процесс

## Задание

Создайте BPMN-диаграмму процесса **обработки заявки на отпуск**:

### Требования:
1. **Start Event** — сотрудник подаёт заявку
2. Минимум **3 задачи** (например: «Подать заявку», «Рассмотреть заявку», «Уведомить сотрудника»)
3. **End Event** — процесс завершён
4. Минимум **1 пул** с дорожками
5. Все элементы должны быть соединены потоками
""",
        "initial_code": '<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n  <bpmn:process id="Process_1" isExecutable="false">\n    <bpmn:startEvent id="StartEvent_1" />\n  </bpmn:process>\n  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\n      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">\n        <dc:Bounds x="200" y="170" width="36" height="36" />\n      </bpmndi:BPMNShape>\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</bpmn:definitions>',
        "correct_answer": '{"mode":"manual","checks":[{"id":"bpmn1-1","type":"element_count","element":"task","value":"3","operator":">="},{"id":"bpmn1-2","type":"element_count","element":"startEvent","value":"1","operator":">="},{"id":"bpmn1-3","type":"element_count","element":"endEvent","value":"1","operator":">="},{"id":"bpmn1-4","type":"lane_count","value":"1","operator":">="}]}',
        "hint": "Создайте пул с дорожками, добавьте Start Event, задачи и End Event. Соедините потоками.",
    },
    {
        "number": 3,
        "title": "Шлюзы и ветвления",
        "slug": "bpmn-gateways",
        "type": "theory",
        "content": """# Шлюзы и ветвления в BPMN

Шлюзы управляют потоком выполнения, создавая ветвления и слияния.

## Exclusive Gateway (XOR)

Выбирает **одну** из возможных ветвей на основе условия.

**Пример:** Заявка одобрена? — Да / Нет

```
Start Event → Задача: Рассмотреть заявку → XOR Gateway
    → [Одобрено] Задача: Оформить → End Event
    → [Отклонено] Задача: Уведомить → End Event
```

## Parallel Gateway (AND)

Запускает **все ветви одновременно**. Используется, когда задачи независимы.

**Пример:** Подготовка к мероприятию:
- Забронировать зал
- Отправить приглашения
- Подготовить материалы

## Inclusive Gateway (OR)

Выбирает **одну или несколько** ветвей.

## Правила использования шлюзов

1. Каждый **разделяющий** шлюз должен иметь соответствующий **объединяющий**
2. Из XOR-шлюза может быть выбрана только одна ветвь
3. Условия на исходящих потоках XOR должны покрывать все варианты
4. Parallel Gateway запускает ВСЕ исходящие ветви

> **Ключевой принцип:** Шлюзы работают парами — один разделяет поток, второй объединяет.
""",
    },
    {
        "number": 4,
        "title": "Процесс обработки заказа",
        "slug": "bpmn-order",
        "type": "practice",
        "content": """# Практика: Процесс обработки заказа

## Задание

Создайте BPMN-диаграмму обработки заказа интернет-магазина:

### Требования:
1. **Start Event** — получение заказа
2. Минимум **4 задачи** (проверить наличие, подтвердить оплату, собрать заказ, отправить)
3. Минимум **1 шлюз** («Товар в наличии?»)
4. **End Event** — заказ доставлен (или «Заказ отменён»)
5. Минимум **2 дорожки** в пуле (Склад, Логистика)
6. Все элементы должны быть соединены потоками
""",
        "initial_code": '<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n  <bpmn:process id="Process_1" isExecutable="false">\n    <bpmn:startEvent id="StartEvent_1" />\n  </bpmn:process>\n  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\n      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">\n        <dc:Bounds x="200" y="170" width="36" height="36" />\n      </bpmndi:BPMNShape>\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</bpmn:definitions>',
        "correct_answer": '{"mode": "code", "code": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<definitions xmlns=\\"http://www.omg.org/spec/BPMN/20100524/MODEL\\" xmlns:xsi=\\"http://www.w3.org/2001/XMLSchema-instance\\" xmlns:bpmndi=\\"http://www.omg.org/spec/BPMN/20100524/DI\\" xmlns:dc=\\"http://www.omg.org/spec/DD/20100524/DC\\" xmlns:di=\\"http://www.omg.org/spec/DD/20100524/DI\\" id=\\"Definitions_1\\" targetNamespace=\\"http://bpmn.io/schema/bpmn\\">\\n  <collaboration id=\\"Collaboration_1\\">\\n    <participant id=\\"Pool_1\\" name=\\"\\u0418\\u043d\\u0442\\u0435\\u0440\\u043d\\u0435\\u0442-\\u043c\\u0430\\u0433\\u0430\\u0437\\u0438\\u043d\\" processRef=\\"Process_1\\" />\\n  </collaboration>\\n  <process id=\\"Process_1\\" isExecutable=\\"false\\">\\n    <laneSet id=\\"LaneSet_1\\">\\n      <lane id=\\"Lane_Warehouse\\" name=\\"\\u0421\\u043a\\u043b\\u0430\\u0434\\">\\n        <flowNodeRef>StartEvent_1</flowNodeRef>\\n        <flowNodeRef>Task_CheckAvailability</flowNodeRef>\\n        <flowNodeRef>Gateway_InStock</flowNodeRef>\\n        <flowNodeRef>EndEvent_Cancelled</flowNodeRef>\\n        <flowNodeRef>Task_AssembleOrder</flowNodeRef>\\n      </lane>\\n      <lane id=\\"Lane_Logistics\\" name=\\"\\u041b\\u043e\\u0433\\u0438\\u0441\\u0442\\u0438\\u043a\\u0430\\">\\n        <flowNodeRef>EndEvent_Delivered</flowNodeRef>\\n        <flowNodeRef>Task_ConfirmPayment</flowNodeRef>\\n        <flowNodeRef>Task_ShipOrder</flowNodeRef>\\n      </lane>\\n    </laneSet>\\n    <startEvent id=\\"StartEvent_1\\" name=\\"\\u0417\\u0430\\u043a\\u0430\\u0437 \\u043f\\u043e\\u043b\\u0443\\u0447\\u0435\\u043d\\">\\n      <outgoing>Flow_1</outgoing>\\n    </startEvent>\\n    <sequenceFlow id=\\"Flow_1\\" sourceRef=\\"StartEvent_1\\" targetRef=\\"Task_CheckAvailability\\" />\\n    <sequenceFlow id=\\"Flow_2\\" sourceRef=\\"Task_CheckAvailability\\" targetRef=\\"Gateway_InStock\\" />\\n    <sequenceFlow id=\\"Flow_Yes\\" name=\\"\\u0414\\u0430\\" sourceRef=\\"Gateway_InStock\\" targetRef=\\"Task_ConfirmPayment\\" />\\n    <sequenceFlow id=\\"Flow_No\\" name=\\"\\u041d\\u0435\\u0442\\" sourceRef=\\"Gateway_InStock\\" targetRef=\\"EndEvent_Cancelled\\" />\\n    <sequenceFlow id=\\"Flow_3\\" sourceRef=\\"Task_ConfirmPayment\\" targetRef=\\"Task_AssembleOrder\\" />\\n    <sequenceFlow id=\\"Flow_4\\" sourceRef=\\"Task_AssembleOrder\\" targetRef=\\"Task_ShipOrder\\" />\\n    <sequenceFlow id=\\"Flow_5\\" sourceRef=\\"Task_ShipOrder\\" targetRef=\\"EndEvent_Delivered\\" />\\n    <endEvent id=\\"EndEvent_Delivered\\" name=\\"\\u0417\\u0430\\u043a\\u0430\\u0437 \\u0434\\u043e\\u0441\\u0442\\u0430\\u0432\\u043b\\u0435\\u043d\\">\\n      <incoming>Flow_5</incoming>\\n    </endEvent>\\n    <task id=\\"Task_CheckAvailability\\" name=\\"\\u041f\\u0440\\u043e\\u0432\\u0435\\u0440\\u0438\\u0442\\u044c \\u043d\\u0430\\u043b\\u0438\\u0447\\u0438\\u0435 \\u0442\\u043e\\u0432\\u0430\\u0440\\u0430\\">\\n      <incoming>Flow_1</incoming>\\n      <outgoing>Flow_2</outgoing>\\n    </task>\\n    <task id=\\"Task_ConfirmPayment\\" name=\\"\\u041f\\u043e\\u0434\\u0442\\u0432\\u0435\\u0440\\u0434\\u0438\\u0442\\u044c \\u043e\\u043f\\u043b\\u0430\\u0442\\u0443\\">\\n      <incoming>Flow_Yes</incoming>\\n      <outgoing>Flow_3</outgoing>\\n    </task>\\n    <exclusiveGateway id=\\"Gateway_InStock\\" name=\\"\\u0422\\u043e\\u0432\\u0430\\u0440 \\u0432 \\u043d\\u0430\\u043b\\u0438\\u0447\\u0438\\u0438?\\">\\n      <incoming>Flow_2</incoming>\\n      <outgoing>Flow_Yes</outgoing>\\n      <outgoing>Flow_No</outgoing>\\n    </exclusiveGateway>\\n    <endEvent id=\\"EndEvent_Cancelled\\" name=\\"\\u0417\\u0430\\u043a\\u0430\\u0437 \\u043e\\u0442\\u043c\\u0435\\u043d\\u0451\\u043d\\">\\n      <incoming>Flow_No</incoming>\\n    </endEvent>\\n    <task id=\\"Task_AssembleOrder\\" name=\\"\\u0421\\u043e\\u0431\\u0440\\u0430\\u0442\\u044c \\u0437\\u0430\\u043a\\u0430\\u0437\\">\\n      <incoming>Flow_3</incoming>\\n      <outgoing>Flow_4</outgoing>\\n    </task>\\n    <task id=\\"Task_ShipOrder\\" name=\\"\\u041e\\u0442\\u043f\\u0440\\u0430\\u0432\\u0438\\u0442\\u044c \\u0437\\u0430\\u043a\\u0430\\u0437\\">\\n      <incoming>Flow_4</incoming>\\n      <outgoing>Flow_5</outgoing>\\n    </task>\\n  </process>\\n  <bpmndi:BPMNDiagram id=\\"BPMNDiagram_1\\">\\n    <bpmndi:BPMNPlane id=\\"BPMNPlane_1\\" bpmnElement=\\"Collaboration_1\\">\\n      <bpmndi:BPMNShape id=\\"Pool_1_di\\" bpmnElement=\\"Pool_1\\" isHorizontal=\\"true\\">\\n        <dc:Bounds x=\\"100\\" y=\\"50\\" width=\\"1060\\" height=\\"370\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Lane_Logistics_di\\" bpmnElement=\\"Lane_Logistics\\" isHorizontal=\\"true\\">\\n        <dc:Bounds x=\\"130\\" y=\\"250\\" width=\\"1030\\" height=\\"170\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_1b4zv5z\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Lane_Warehouse_di\\" bpmnElement=\\"Lane_Warehouse\\" isHorizontal=\\"true\\">\\n        <dc:Bounds x=\\"130\\" y=\\"50\\" width=\\"1030\\" height=\\"200\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"StartEvent_1_di\\" bpmnElement=\\"StartEvent_1\\">\\n        <dc:Bounds x=\\"192\\" y=\\"142\\" width=\\"36\\" height=\\"36\\" />\\n        <bpmndi:BPMNLabel>\\n          <dc:Bounds x=\\"172\\" y=\\"185\\" width=\\"76\\" height=\\"14\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"EndEvent_Delivered_di\\" bpmnElement=\\"EndEvent_Delivered\\">\\n        <dc:Bounds x=\\"1072\\" y=\\"322\\" width=\\"36\\" height=\\"36\\" />\\n        <bpmndi:BPMNLabel>\\n          <dc:Bounds x=\\"1047\\" y=\\"365\\" width=\\"86\\" height=\\"14\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_CheckAvailability_di\\" bpmnElement=\\"Task_CheckAvailability\\">\\n        <dc:Bounds x=\\"280\\" y=\\"120\\" width=\\"160\\" height=\\"80\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_ConfirmPayment_di\\" bpmnElement=\\"Task_ConfirmPayment\\">\\n        <dc:Bounds x=\\"580\\" y=\\"300\\" width=\\"160\\" height=\\"80\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Gateway_InStock_di\\" bpmnElement=\\"Gateway_InStock\\" isMarkerVisible=\\"true\\">\\n        <dc:Bounds x=\\"495\\" y=\\"135\\" width=\\"50\\" height=\\"50\\" />\\n        <bpmndi:BPMNLabel>\\n          <dc:Bounds x=\\"555\\" y=\\"153\\" width=\\"90\\" height=\\"14\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"EndEvent_Cancelled_di\\" bpmnElement=\\"EndEvent_Cancelled\\">\\n        <dc:Bounds x=\\"602\\" y=\\"92\\" width=\\"36\\" height=\\"36\\" />\\n        <bpmndi:BPMNLabel>\\n          <dc:Bounds x=\\"583\\" y=\\"62\\" width=\\"75\\" height=\\"14\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_AssembleOrder_di\\" bpmnElement=\\"Task_AssembleOrder\\">\\n        <dc:Bounds x=\\"820\\" y=\\"120\\" width=\\"160\\" height=\\"80\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_ShipOrder_di\\" bpmnElement=\\"Task_ShipOrder\\">\\n        <dc:Bounds x=\\"820\\" y=\\"300\\" width=\\"160\\" height=\\"80\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNEdge id=\\"Flow_1_di\\" bpmnElement=\\"Flow_1\\">\\n        <di:waypoint x=\\"228\\" y=\\"160\\" />\\n        <di:waypoint x=\\"280\\" y=\\"160\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_2_di\\" bpmnElement=\\"Flow_2\\">\\n        <di:waypoint x=\\"440\\" y=\\"160\\" />\\n        <di:waypoint x=\\"495\\" y=\\"160\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_Yes_di\\" bpmnElement=\\"Flow_Yes\\">\\n        <di:waypoint x=\\"520\\" y=\\"185\\" />\\n        <di:waypoint x=\\"520\\" y=\\"340\\" />\\n        <di:waypoint x=\\"580\\" y=\\"340\\" />\\n        <bpmndi:BPMNLabel>\\n          <dc:Bounds x=\\"531\\" y=\\"303\\" width=\\"13\\" height=\\"14\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_No_di\\" bpmnElement=\\"Flow_No\\">\\n        <di:waypoint x=\\"520\\" y=\\"135\\" />\\n        <di:waypoint x=\\"520\\" y=\\"110\\" />\\n        <di:waypoint x=\\"602\\" y=\\"110\\" />\\n        <bpmndi:BPMNLabel>\\n          <dc:Bounds x=\\"527\\" y=\\"117\\" width=\\"20\\" height=\\"14\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_3_di\\" bpmnElement=\\"Flow_3\\">\\n        <di:waypoint x=\\"660\\" y=\\"300\\" />\\n        <di:waypoint x=\\"660\\" y=\\"160\\" />\\n        <di:waypoint x=\\"820\\" y=\\"160\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_4_di\\" bpmnElement=\\"Flow_4\\">\\n        <di:waypoint x=\\"900\\" y=\\"200\\" />\\n        <di:waypoint x=\\"900\\" y=\\"300\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"Flow_5_di\\" bpmnElement=\\"Flow_5\\">\\n        <di:waypoint x=\\"980\\" y=\\"340\\" />\\n        <di:waypoint x=\\"1072\\" y=\\"340\\" />\\n      </bpmndi:BPMNEdge>\\n    </bpmndi:BPMNPlane>\\n  </bpmndi:BPMNDiagram>\\n</definitions>", "checkNodeCount": true, "checkEdgeCount": true, "checkNodeNames": true}',
        "hint": "Создайте пул с 2 дорожками. Добавьте шлюз XOR после задачи «Проверить наличие». Две ветви: в наличии → собрать → отправить, нет → отменить.",
    },
    {
        "number": 5,
        "title": "Регистрация клиента",
        "slug": "bpmn-code-test",
        "type": "practice",
        "content": """# Практика: Процесс регистрации клиента

В этом задании ваш ответ будет проверяться путём **сравнения с эталонным решением** — подсчёт узлов, связей и дорожек.

## Задание

Создайте BPMN-диаграмму процесса регистрации клиента:

1. **Start Event** → «Заполнить форму» → «Отправить данные» → **End Event**
2. Пул с именем "Клиент", внутри 1 дорожка с именем "Процесс регистрации"
3. Все элементы соединены потоками.

""",
        "initial_code": '<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n  <bpmn:process id="Process_1" isExecutable="false">\n    <bpmn:startEvent id="StartEvent_1" />\n  </bpmn:process>\n  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\n      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">\n        <dc:Bounds x="200" y="170" width="36" height="36" />\n      </bpmndi:BPMNShape>\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</bpmn:definitions>',
        "correct_answer": '{"mode": "code", "code": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<definitions xmlns=\\"http://www.omg.org/spec/BPMN/20100524/MODEL\\" xmlns:bpmndi=\\"http://www.omg.org/spec/BPMN/20100524/DI\\" xmlns:dc=\\"http://www.omg.org/spec/DD/20100524/DC\\" xmlns:di=\\"http://www.omg.org/spec/DD/20100524/DI\\" id=\\"Definitions_1\\" targetNamespace=\\"http://bpmn.io/schema/bpmn\\">\\n  <collaboration id=\\"Collaboration_1\\">\\n    <participant id=\\"Participant_1uquzmo\\" name=\\"\\u041a\\u043b\\u0438\\u0435\\u043d\\u0442\\" processRef=\\"Process_1ocw42s\\" />\\n  </collaboration>\\n  <process id=\\"Process_1ocw42s\\">\\n    <laneSet id=\\"LaneSet_1bz3hep\\">\\n      <lane id=\\"Lane_1upzzm3\\" name=\\"\\u041f\\u0440\\u043e\\u0446\\u0435\\u0441\\u0441 \\u0440\\u0435\\u0433\\u0438\\u0441\\u0442\\u0440\\u0430\\u0446\\u0438\\u0438\\">\\n        <flowNodeRef>EndEvent_0onjrtg</flowNodeRef>\\n        <flowNodeRef>Task_0x3c2yr</flowNodeRef>\\n        <flowNodeRef>Task_02h45e6</flowNodeRef>\\n        <flowNodeRef>StartEvent_1bkvt2h</flowNodeRef>\\n      </lane>\\n    </laneSet>\\n    <sequenceFlow id=\\"SequenceFlow_142c5ft\\" sourceRef=\\"StartEvent_1bkvt2h\\" targetRef=\\"Task_02h45e6\\" />\\n    <sequenceFlow id=\\"SequenceFlow_1qkx4ha\\" sourceRef=\\"Task_02h45e6\\" targetRef=\\"Task_0x3c2yr\\" />\\n    <sequenceFlow id=\\"SequenceFlow_0kd9vud\\" sourceRef=\\"Task_0x3c2yr\\" targetRef=\\"EndEvent_0onjrtg\\" />\\n    <endEvent id=\\"EndEvent_0onjrtg\\" name=\\"\\u0420\\u0435\\u0433\\u0438\\u0441\\u0442\\u0440\\u0430\\u0446\\u0438\\u044f \\u0437\\u0430\\u0432\\u0435\\u0440\\u0448\\u0435\\u043d\\u0430\\">\\n      <incoming>SequenceFlow_0kd9vud</incoming>\\n    </endEvent>\\n    <task id=\\"Task_0x3c2yr\\" name=\\"\\u041e\\u0442\\u043f\\u0440\\u0430\\u0432\\u0438\\u0442\\u044c \\u0434\\u0430\\u043d\\u043d\\u044b\\u0435\\">\\n      <incoming>SequenceFlow_1qkx4ha</incoming>\\n      <outgoing>SequenceFlow_0kd9vud</outgoing>\\n    </task>\\n    <task id=\\"Task_02h45e6\\" name=\\"\\u0417\\u0430\\u043f\\u043e\\u043b\\u043d\\u0438\\u0442\\u044c \\u0444\\u043e\\u0440\\u043c\\u0443\\">\\n      <incoming>SequenceFlow_142c5ft</incoming>\\n      <outgoing>SequenceFlow_1qkx4ha</outgoing>\\n    </task>\\n    <startEvent id=\\"StartEvent_1bkvt2h\\" name=\\"\\u041d\\u0430\\u0447\\u0430\\u043b\\u043e \\u0440\\u0435\\u0433\\u0438\\u0441\\u0442\\u0440\\u0430\\u0446\\u0438\\u0438\\">\\n      <outgoing>SequenceFlow_142c5ft</outgoing>\\n    </startEvent>\\n  </process>\\n  <bpmndi:BPMNDiagram id=\\"BPMNDiagram_1\\">\\n    <bpmndi:BPMNPlane id=\\"BPMNPlane_1\\" bpmnElement=\\"Collaboration_1\\">\\n      <bpmndi:BPMNShape id=\\"Participant_1uquzmo_di\\" bpmnElement=\\"Participant_1uquzmo\\" isHorizontal=\\"true\\">\\n        <dc:Bounds x=\\"380\\" y=\\"130\\" width=\\"730\\" height=\\"190\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_0o0bfng\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Lane_1upzzm3_di\\" bpmnElement=\\"Lane_1upzzm3\\" isHorizontal=\\"true\\">\\n        <dc:Bounds x=\\"410\\" y=\\"130\\" width=\\"700\\" height=\\"190\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_10m8fai\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"EndEvent_0onjrtg_di\\" bpmnElement=\\"EndEvent_0onjrtg\\">\\n        <dc:Bounds x=\\"982\\" y=\\"202\\" width=\\"36\\" height=\\"36\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_0a09r3n\\">\\n          <dc:Bounds x=\\"968\\" y=\\"245\\" width=\\"65\\" height=\\"27\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_0x3c2yr_di\\" bpmnElement=\\"Task_0x3c2yr\\">\\n        <dc:Bounds x=\\"810\\" y=\\"180\\" width=\\"100\\" height=\\"80\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_08j9xyv\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"Task_02h45e6_di\\" bpmnElement=\\"Task_02h45e6\\">\\n        <dc:Bounds x=\\"620\\" y=\\"180\\" width=\\"100\\" height=\\"80\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_0f7yqg2\\" />\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNShape id=\\"StartEvent_1bkvt2h_di\\" bpmnElement=\\"StartEvent_1bkvt2h\\">\\n        <dc:Bounds x=\\"482\\" y=\\"202\\" width=\\"36\\" height=\\"36\\" />\\n        <bpmndi:BPMNLabel id=\\"BPMNLabel_0dikxsy\\">\\n          <dc:Bounds x=\\"468\\" y=\\"245\\" width=\\"64\\" height=\\"27\\" />\\n        </bpmndi:BPMNLabel>\\n      </bpmndi:BPMNShape>\\n      <bpmndi:BPMNEdge id=\\"SequenceFlow_142c5ft_di\\" bpmnElement=\\"SequenceFlow_142c5ft\\">\\n        <di:waypoint x=\\"518\\" y=\\"220\\" />\\n        <di:waypoint x=\\"620\\" y=\\"220\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"SequenceFlow_1qkx4ha_di\\" bpmnElement=\\"SequenceFlow_1qkx4ha\\">\\n        <di:waypoint x=\\"720\\" y=\\"220\\" />\\n        <di:waypoint x=\\"810\\" y=\\"220\\" />\\n      </bpmndi:BPMNEdge>\\n      <bpmndi:BPMNEdge id=\\"SequenceFlow_0kd9vud_di\\" bpmnElement=\\"SequenceFlow_0kd9vud\\">\\n        <di:waypoint x=\\"910\\" y=\\"220\\" />\\n        <di:waypoint x=\\"982\\" y=\\"220\\" />\\n      </bpmndi:BPMNEdge>\\n    </bpmndi:BPMNPlane>\\n  </bpmndi:BPMNDiagram>\\n</definitions>\\n", "checkNodeCount": true, "checkEdgeCount": true, "checkNodeNames": true}',
        "hint": "Создайте линейный процесс: Start → Заполнить форму → Отправить данные → End. Добавьте пул с дорожкой.",
    },
]

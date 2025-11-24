import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Quiz from '../models/Quiz';
import User from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sis-education';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user if not exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@sis.edu',
        password: 'admin123',
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'admin',
      });
      await admin.save();
      console.log('Created admin user: admin / admin123');
    }

    // ============================================
    // NETWORK ADMINISTRATION COURSE
    // ============================================
    const networkCourse = new Course({
      title: 'Основы сетевого администрирования с Cisco Packet Tracer',
      description:
        'Изучите основы сетевого администрирования с использованием Cisco Packet Tracer. Научитесь настраивать маршрутизаторы, коммутаторы и создавать сети.',
      category: 'network',
      level: 'beginner',
      order: 1,
      isPublished: true,
      lessons: [],
    });
    await networkCourse.save();
    console.log('Created network course');

    // Network Lesson 1
    const networkLesson1 = new Lesson({
      title: 'Введение в Cisco Packet Tracer',
      description: 'Знакомство с интерфейсом и основными возможностями Cisco Packet Tracer',
      content: `
        <h2>Что такое Cisco Packet Tracer?</h2>
        <p>Cisco Packet Tracer - это мощный инструмент для моделирования сетей, разработанный компанией Cisco Systems. Он позволяет создавать виртуальные сети, настраивать оборудование и тестировать различные сценарии без необходимости физического оборудования.</p>
        
        <h3>Основные возможности:</h3>
        <ul>
          <li>Создание топологий сетей</li>
          <li>Настройка маршрутизаторов и коммутаторов</li>
          <li>Моделирование различных сетевых протоколов</li>
          <li>Тестирование и отладка сетей</li>
        </ul>
        
        <h3>Интерфейс программы</h3>
        <p>Основные элементы интерфейса:</p>
        <ul>
          <li><strong>Панель устройств</strong> - содержит различные типы сетевого оборудования</li>
          <li><strong>Рабочая область</strong> - место, где создается топология сети</li>
          <li><strong>Панель управления</strong> - инструменты для работы с проектом</li>
        </ul>
      `,
      course: networkCourse._id,
      order: 1,
      duration: 30,
      isPublished: true,
      exercises: [
        {
          title: 'Знакомство с интерфейсом',
          description: 'Изучите интерфейс Packet Tracer',
          type: 'practical',
          instructions: 'Откройте Cisco Packet Tracer и изучите основные элементы интерфейса. Попробуйте добавить несколько устройств на рабочую область. Создайте простую топологию с двумя компьютерами и коммутатором.',
        },
      ],
    });
    await networkLesson1.save();

    // Network Lesson 2
    const networkLesson2 = new Lesson({
      title: 'Основы TCP/IP',
      description: 'Изучение базовых принципов протокола TCP/IP',
      content: `
        <h2>Протокол TCP/IP</h2>
        <p>TCP/IP (Transmission Control Protocol/Internet Protocol) - это набор протоколов, используемых для связи устройств в сети.</p>
        
        <h3>Модель TCP/IP состоит из 4 уровней:</h3>
        <ol>
          <li><strong>Прикладной уровень</strong> - обеспечивает взаимодействие приложений</li>
          <li><strong>Транспортный уровень</strong> - обеспечивает надежную передачу данных (TCP, UDP)</li>
          <li><strong>Сетевой уровень</strong> - отвечает за маршрутизацию (IP)</li>
          <li><strong>Канальный уровень</strong> - управляет передачей данных между устройствами</li>
        </ol>
        
        <h3>IP-адресация</h3>
        <p>IP-адрес - это уникальный идентификатор устройства в сети. Формат IPv4: XXX.XXX.XXX.XXX (например, 192.168.1.1)</p>
        <p>Маска подсети определяет, какая часть IP-адреса относится к сети, а какая - к хосту.</p>
        <p>Пример: IP 192.168.1.10 с маской 255.255.255.0 означает, что первые три октета (192.168.1) - это сеть, а последний (10) - хост.</p>
      `,
      course: networkCourse._id,
      order: 2,
      duration: 45,
      isPublished: true,
      exercises: [
        {
          title: 'Расчет IP-адресов',
          description: 'Научитесь рассчитывать сетевые адреса',
          type: 'theoretical',
          instructions: 'Для IP-адреса 192.168.1.50 с маской 255.255.255.0 определите: сетевой адрес, широковещательный адрес, количество доступных хостов.',
        },
      ],
    });
    await networkLesson2.save();

    // Network Lesson 3
    const networkLesson3 = new Lesson({
      title: 'Настройка маршрутизаторов',
      description: 'Настройка базовых параметров маршрутизаторов Cisco',
      content: `
        <h2>Настройка маршрутизаторов Cisco</h2>
        <p>Маршрутизатор - это устройство, которое пересылает пакеты данных между сетями.</p>
        
        <h3>Основные команды настройки:</h3>
        <pre><code>enable
configure terminal
interface GigabitEthernet0/0
ip address 192.168.1.1 255.255.255.0
no shutdown
exit
</code></pre>
        
        <h3>Проверка конфигурации:</h3>
        <pre><code>show ip interface brief
show running-config
ping 192.168.1.2
</code></pre>
        
        <h3>Настройка пароля:</h3>
        <pre><code>enable secret password123
line console 0
password console123
login
</code></pre>
      `,
      course: networkCourse._id,
      order: 3,
      duration: 60,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка маршрутизатора',
          description: 'Настройте маршрутизатор с IP-адресом',
          type: 'practical',
          instructions: 'Создайте простую сеть с маршрутизатором и двумя компьютерами. Настройте IP-адреса на всех устройствах (192.168.1.1 для роутера, 192.168.1.10 и 192.168.1.20 для компьютеров). Проверьте связность с помощью команды ping.',
        },
      ],
    });
    await networkLesson3.save();

    // Network Lesson 4
    const networkLesson4 = new Lesson({
      title: 'Настройка коммутаторов',
      description: 'Базовая настройка коммутаторов Cisco',
      content: `
        <h2>Коммутаторы Cisco</h2>
        <p>Коммутатор - это устройство, которое соединяет устройства в локальной сети (LAN).</p>
        
        <h3>Основные команды:</h3>
        <pre><code>enable
configure terminal
hostname Switch1
interface vlan 1
ip address 192.168.1.100 255.255.255.0
no shutdown
exit
</code></pre>
        
        <h3>Проверка MAC-адресов:</h3>
        <pre><code>show mac-address-table
show interfaces
</code></pre>
        
        <h3>Настройка портов:</h3>
        <pre><code>interface FastEthernet0/1
description Connected to PC1
speed 100
duplex full
</code></pre>
      `,
      course: networkCourse._id,
      order: 4,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка коммутатора',
          description: 'Настройте коммутатор и подключите устройства',
          type: 'practical',
          instructions: 'Создайте сеть с коммутатором и тремя компьютерами. Настройте IP-адреса на компьютерах и проверьте, что они могут обмениваться данными через коммутатор.',
        },
      ],
    });
    await networkLesson4.save();

    // Network Lesson 5
    const networkLesson5 = new Lesson({
      title: 'VLAN - Виртуальные локальные сети',
      description: 'Создание и настройка VLAN',
      content: `
        <h2>VLAN (Virtual LAN)</h2>
        <p>VLAN позволяет логически разделить физическую сеть на несколько виртуальных сетей.</p>
        
        <h3>Создание VLAN:</h3>
        <pre><code>configure terminal
vlan 10
name Sales
vlan 20
name Marketing
exit
</code></pre>
        
        <h3>Назначение портов VLAN:</h3>
        <pre><code>interface FastEthernet0/1
switchport mode access
switchport access vlan 10
</code></pre>
        
        <h3>Проверка конфигурации:</h3>
        <pre><code>show vlan brief
show interfaces switchport
</code></pre>
      `,
      course: networkCourse._id,
      order: 5,
      duration: 55,
      isPublished: true,
      exercises: [
        {
          title: 'Создание VLAN',
          description: 'Создайте несколько VLAN и назначьте порты',
          type: 'practical',
          instructions: 'Создайте коммутатор с двумя VLAN (10 и 20). Подключите по два компьютера к каждому VLAN. Убедитесь, что компьютеры в одном VLAN могут общаться, а между разными VLAN - нет.',
        },
      ],
    });
    await networkLesson5.save();

    // Network Lesson 6
    const networkLesson6 = new Lesson({
      title: 'Статическая маршрутизация',
      description: 'Настройка статических маршрутов',
      content: `
        <h2>Статическая маршрутизация</h2>
        <p>Статическая маршрутизация - это ручная настройка таблицы маршрутизации.</p>
        
        <h3>Добавление статического маршрута:</h3>
        <pre><code>ip route 192.168.2.0 255.255.255.0 192.168.1.2
ip route 0.0.0.0 0.0.0.0 192.168.1.1
</code></pre>
        
        <h3>Проверка таблицы маршрутизации:</h3>
        <pre><code>show ip route
show ip route static
</code></pre>
        
        <h3>Удаление маршрута:</h3>
        <pre><code>no ip route 192.168.2.0 255.255.255.0 192.168.1.2
</code></pre>
      `,
      course: networkCourse._id,
      order: 6,
      duration: 60,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка статической маршрутизации',
          description: 'Создайте сеть с несколькими подсетями и настройте маршрутизацию',
          type: 'practical',
          instructions: 'Создайте топологию с двумя маршрутизаторами и тремя подсетями (192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24). Настройте статические маршруты так, чтобы все подсети могли общаться друг с другом.',
        },
      ],
    });
    await networkLesson6.save();

    // Network Lesson 7
    const networkLesson7 = new Lesson({
      title: 'DHCP - Динамическая настройка хостов',
      description: 'Настройка DHCP сервера',
      content: `
        <h2>DHCP (Dynamic Host Configuration Protocol)</h2>
        <p>DHCP автоматически назначает IP-адреса устройствам в сети.</p>
        
        <h3>Настройка DHCP на маршрутизаторе:</h3>
        <pre><code>configure terminal
ip dhcp pool LAN
network 192.168.1.0 255.255.255.0
default-router 192.168.1.1
dns-server 8.8.8.8
exit
ip dhcp excluded-address 192.168.1.1 192.168.1.10
</code></pre>
        
        <h3>Проверка DHCP:</h3>
        <pre><code>show ip dhcp binding
show ip dhcp pool
</code></pre>
      `,
      course: networkCourse._id,
      order: 7,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка DHCP',
          description: 'Настройте DHCP сервер на маршрутизаторе',
          type: 'practical',
          instructions: 'Настройте DHCP пул для сети 192.168.1.0/24. Исключите адреса 192.168.1.1-10. Подключите компьютеры и убедитесь, что они получают IP-адреса автоматически.',
        },
      ],
    });
    await networkLesson7.save();

    // Network Lesson 8
    const networkLesson8 = new Lesson({
      title: 'NAT - Преобразование сетевых адресов',
      description: 'Настройка NAT для доступа в интернет',
      content: `
        <h2>NAT (Network Address Translation)</h2>
        <p>NAT позволяет преобразовывать частные IP-адреса в публичные и наоборот.</p>
        
        <h3>Настройка NAT:</h3>
        <pre><code>configure terminal
interface GigabitEthernet0/0
ip nat inside
interface GigabitEthernet0/1
ip nat outside
exit
access-list 1 permit 192.168.1.0 0.0.0.255
ip nat inside source list 1 interface GigabitEthernet0/1 overload
</code></pre>
        
        <h3>Проверка NAT:</h3>
        <pre><code>show ip nat translations
show ip nat statistics
</code></pre>
      `,
      course: networkCourse._id,
      order: 8,
      duration: 55,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка NAT',
          description: 'Настройте NAT для доступа внутренней сети в интернет',
          type: 'practical',
          instructions: 'Создайте сеть с внутренней подсетью (192.168.1.0/24) и внешним интерфейсом. Настройте NAT так, чтобы внутренние устройства могли получать доступ к внешней сети.',
        },
      ],
    });
    await networkLesson8.save();

    // Update network course
    networkCourse.lessons = [
      String(networkLesson1._id),
      String(networkLesson2._id),
      String(networkLesson3._id),
      String(networkLesson4._id),
      String(networkLesson5._id),
      String(networkLesson6._id),
      String(networkLesson7._id),
      String(networkLesson8._id),
    ] as any;
    await networkCourse.save();

    // Network Quizzes
    const networkQuiz1 = new Quiz({
      title: 'Тест: Введение в Cisco Packet Tracer',
      description: 'Проверьте знания по интерфейсу Packet Tracer',
      course: networkCourse._id,
      lesson: networkLesson1._id,
      questions: [
        {
          question: 'Что такое Cisco Packet Tracer?',
          type: 'single',
          options: [
            'Программа для создания документов',
            'Инструмент для моделирования сетей',
            'Операционная система',
            'Язык программирования',
          ],
          correctAnswers: ['Инструмент для моделирования сетей'],
          points: 1,
          explanation: 'Cisco Packet Tracer - это инструмент для моделирования и симуляции сетей.',
        },
        {
          question: 'Какие элементы содержит интерфейс Packet Tracer?',
          type: 'multiple',
          options: ['Панель устройств', 'Рабочая область', 'Панель управления', 'Редактор кода'],
          correctAnswers: ['Панель устройств', 'Рабочая область', 'Панель управления'],
          points: 2,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await networkQuiz1.save();

    const networkQuiz2 = new Quiz({
      title: 'Тест: Основы TCP/IP',
      description: 'Проверьте знания по протоколу TCP/IP',
      course: networkCourse._id,
      lesson: networkLesson2._id,
      questions: [
        {
          question: 'Сколько уровней в модели TCP/IP?',
          type: 'single',
          options: ['3', '4', '5', '7'],
          correctAnswers: ['4'],
          points: 1,
          explanation: 'Модель TCP/IP состоит из 4 уровней: прикладной, транспортный, сетевой и канальный.',
        },
        {
          question: 'Какие уровни включает модель TCP/IP?',
          type: 'multiple',
          options: ['Прикладной', 'Транспортный', 'Сетевой', 'Физический'],
          correctAnswers: ['Прикладной', 'Транспортный', 'Сетевой'],
          points: 2,
        },
        {
          question: 'Что означает IP в TCP/IP?',
          type: 'text',
          correctAnswers: ['Internet Protocol'],
          points: 1,
        },
        {
          question: 'Какой формат имеет IPv4 адрес?',
          type: 'single',
          options: ['XXX.XXX.XXX.XXX', 'XXXX:XXXX:XXXX:XXXX', 'XXXXXXXX', 'XXX-XXX-XXX-XXX'],
          correctAnswers: ['XXX.XXX.XXX.XXX'],
          points: 1,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await networkQuiz2.save();

    const networkQuiz3 = new Quiz({
      title: 'Тест: Настройка маршрутизаторов',
      description: 'Проверьте знания по настройке маршрутизаторов',
      course: networkCourse._id,
      lesson: networkLesson3._id,
      questions: [
        {
          question: 'Какая команда используется для входа в режим конфигурации?',
          type: 'single',
          options: ['config', 'configure terminal', 'setup', 'config mode'],
          correctAnswers: ['configure terminal'],
          points: 1,
        },
        {
          question: 'Какая команда показывает краткую информацию об интерфейсах?',
          type: 'single',
          options: ['show interfaces', 'show ip interface brief', 'show config', 'show ip'],
          correctAnswers: ['show ip interface brief'],
          points: 1,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await networkQuiz3.save();

    // Final Network Quiz
    const networkFinalQuiz = new Quiz({
      title: 'Итоговый тест: Сетевое администрирование',
      description: 'Итоговый тест по всему курсу сетевого администрирования',
      course: networkCourse._id,
      questions: [
        {
          question: 'Что такое маршрутизатор?',
          type: 'single',
          options: [
            'Устройство для соединения устройств в одной сети',
            'Устройство для пересылки пакетов между сетями',
            'Устройство для усиления сигнала',
            'Устройство для фильтрации трафика',
          ],
          correctAnswers: ['Устройство для пересылки пакетов между сетями'],
          points: 2,
        },
        {
          question: 'Что такое VLAN?',
          type: 'single',
          options: [
            'Виртуальная локальная сеть',
            'Внешняя локальная сеть',
            'Временная локальная сеть',
            'Волоконная локальная сеть',
          ],
          correctAnswers: ['Виртуальная локальная сеть'],
          points: 2,
        },
        {
          question: 'Что делает DHCP?',
          type: 'single',
          options: [
            'Назначает IP-адреса вручную',
            'Автоматически назначает IP-адреса',
            'Проверяет связность сети',
            'Настраивает маршрутизацию',
          ],
          correctAnswers: ['Автоматически назначает IP-адреса'],
          points: 2,
        },
        {
          question: 'Какие протоколы работают на транспортном уровне?',
          type: 'multiple',
          options: ['TCP', 'UDP', 'IP', 'HTTP'],
          correctAnswers: ['TCP', 'UDP'],
          points: 3,
        },
        {
          question: 'Что такое NAT?',
          type: 'text',
          correctAnswers: ['Network Address Translation', 'Преобразование сетевых адресов'],
          points: 2,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await networkFinalQuiz.save();

    console.log('Created network course with 8 lessons and quizzes');

    // ============================================
    // LINUX SYSTEM ADMINISTRATION COURSE
    // ============================================
    const linuxCourse = new Course({
      title: 'Системное администрирование Linux',
      description:
        'Изучите основы системного администрирования Linux. Научитесь работать с файловой системой, управлять пользователями, настраивать сетевые службы.',
      category: 'system-linux',
      level: 'beginner',
      order: 2,
      isPublished: true,
      lessons: [],
    });
    await linuxCourse.save();
    console.log('Created Linux course');

    // Linux Lesson 1
    const linuxLesson1 = new Lesson({
      title: 'Введение в Linux',
      description: 'Знакомство с операционной системой Linux',
      content: `
        <h2>Что такое Linux?</h2>
        <p>Linux - это операционная система с открытым исходным кодом, основанная на Unix. Она широко используется для серверов, встроенных систем и суперкомпьютеров.</p>
        
        <h3>Основные преимущества Linux:</h3>
        <ul>
          <li>Бесплатность и открытый исходный код</li>
          <li>Безопасность и стабильность</li>
          <li>Гибкость настройки</li>
          <li>Мощная командная строка</li>
        </ul>
        
        <h3>Популярные дистрибутивы:</h3>
        <ul>
          <li><strong>Ubuntu</strong> - для начинающих, основан на Debian</li>
          <li><strong>CentOS/RHEL</strong> - для серверов, корпоративное использование</li>
          <li><strong>Debian</strong> - стабильный и надежный</li>
          <li><strong>Arch Linux</strong> - для продвинутых пользователей</li>
        </ul>
        
        <h3>Структура системы:</h3>
        <p>Linux использует иерархическую файловую систему, где все начинается с корневого каталога (/).</p>
      `,
      course: linuxCourse._id,
      order: 1,
      duration: 40,
      isPublished: true,
    });
    await linuxLesson1.save();

    // Linux Lesson 2
    const linuxLesson2 = new Lesson({
      title: 'Файловая система Linux',
      description: 'Структура файловой системы и основные команды',
      content: `
        <h2>Структура файловой системы</h2>
        <p>В Linux все начинается с корневого каталога (/). Основные директории:</p>
        <ul>
          <li><strong>/bin</strong> - основные исполняемые файлы</li>
          <li><strong>/etc</strong> - конфигурационные файлы</li>
          <li><strong>/home</strong> - домашние директории пользователей</li>
          <li><strong>/var</strong> - переменные данные (логи, кэш)</li>
          <li><strong>/usr</strong> - пользовательские программы</li>
          <li><strong>/tmp</strong> - временные файлы</li>
          <li><strong>/root</strong> - домашняя директория root</li>
        </ul>
        
        <h3>Основные команды для работы с файлами:</h3>
        <pre><code>ls - список файлов
ls -la - подробный список с скрытыми файлами
cd - изменение директории
cd ~ - переход в домашнюю директорию
pwd - текущая директория
mkdir - создание директории
rm - удаление файла
rm -rf - удаление директории рекурсивно
cp - копирование файла
cp -r - копирование директории
mv - перемещение/переименование файла
</code></pre>
      `,
      course: linuxCourse._id,
      order: 2,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Работа с файловой системой',
          description: 'Практикуйтесь в использовании команд Linux',
          type: 'practical',
          instructions: 'Создайте структуру директорий: project/src, project/docs, project/tests. Создайте несколько тестовых файлов и переместите их между директориями. Используйте команды ls, cd, mkdir, touch, mv, cp.',
        },
      ],
    });
    await linuxLesson2.save();

    // Linux Lesson 3
    const linuxLesson3 = new Lesson({
      title: 'Управление пользователями и правами',
      description: 'Создание пользователей и настройка прав доступа',
      content: `
        <h2>Управление пользователями</h2>
        <p>В Linux каждый пользователь имеет свой аккаунт с уникальным идентификатором (UID).</p>
        
        <h3>Основные команды:</h3>
        <pre><code>useradd username - создание пользователя
useradd -m username - создание с домашней директорией
usermod - изменение пользователя
userdel username - удаление пользователя
userdel -r username - удаление с домашней директорией
passwd username - изменение пароля
</code></pre>
        
        <h3>Права доступа к файлам</h3>
        <p>Права доступа определяются тремя категориями:</p>
        <ul>
          <li><strong>Владелец (owner)</strong> - пользователь-владелец файла</li>
          <li><strong>Группа (group)</strong> - группа пользователей</li>
          <li><strong>Остальные (others)</strong> - все остальные пользователи</li>
        </ul>
        <p>Права: r (read) - чтение (4), w (write) - запись (2), x (execute) - выполнение (1)</p>
        <pre><code>chmod 755 file.txt - установка прав (rwxr-xr-x)
chmod u+x file.txt - добавить выполнение для владельца
chown user:group file.txt - изменение владельца
chgrp group file.txt - изменение группы
</code></pre>
      `,
      course: linuxCourse._id,
      order: 3,
      duration: 60,
      isPublished: true,
      exercises: [
        {
          title: 'Управление пользователями',
          description: 'Создайте пользователей и настройте права',
          type: 'practical',
          instructions: 'Создайте двух новых пользователей. Создайте файл и установите права так, чтобы владелец мог читать и писать, группа - только читать, остальные - никаких прав (chmod 640).',
        },
      ],
    });
    await linuxLesson3.save();

    // Linux Lesson 4
    const linuxLesson4 = new Lesson({
      title: 'Управление пакетами',
      description: 'Установка и управление программным обеспечением',
      content: `
        <h2>Управление пакетами</h2>
        <p>В Linux программное обеспечение устанавливается через пакетные менеджеры.</p>
        
        <h3>APT (Ubuntu/Debian):</h3>
        <pre><code>apt update - обновление списка пакетов
apt upgrade - обновление установленных пакетов
apt install package_name - установка пакета
apt remove package_name - удаление пакета
apt search keyword - поиск пакета
apt list --installed - список установленных пакетов
</code></pre>
        
        <h3>YUM/DNF (CentOS/RHEL):</h3>
        <pre><code>yum update - обновление пакетов
yum install package_name - установка
yum remove package_name - удаление
yum search keyword - поиск
</code></pre>
        
        <h3>RPM пакеты:</h3>
        <pre><code>rpm -i package.rpm - установка
rpm -e package - удаление
rpm -qa - список всех установленных пакетов
</code></pre>
      `,
      course: linuxCourse._id,
      order: 4,
      duration: 45,
      isPublished: true,
      exercises: [
        {
          title: 'Установка пакетов',
          description: 'Практикуйтесь в установке программ',
          type: 'practical',
          instructions: 'Обновите список пакетов. Найдите и установите пакет htop (монитор процессов). Проверьте, что он установлен. Затем удалите его.',
        },
      ],
    });
    await linuxLesson4.save();

    // Linux Lesson 5
    const linuxLesson5 = new Lesson({
      title: 'Работа с процессами',
      description: 'Управление процессами и службами',
      content: `
        <h2>Управление процессами</h2>
        <p>Процесс - это запущенная программа в системе.</p>
        
        <h3>Основные команды:</h3>
        <pre><code>ps - список процессов
ps aux - подробный список всех процессов
top - интерактивный монитор процессов
htop - улучшенная версия top
kill PID - завершить процесс
kill -9 PID - принудительное завершение
killall process_name - завершить все процессы с именем
</code></pre>
        
        <h3>Управление службами (systemd):</h3>
        <pre><code>systemctl start service_name - запустить службу
systemctl stop service_name - остановить службу
systemctl restart service_name - перезапустить
systemctl status service_name - статус службы
systemctl enable service_name - автозапуск
systemctl disable service_name - отключить автозапуск
systemctl list-units --type=service - список всех служб
</code></pre>
      `,
      course: linuxCourse._id,
      order: 5,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Управление процессами',
          description: 'Изучите процессы и службы',
          type: 'practical',
          instructions: 'Запустите команду top и изучите информацию о процессах. Найдите процесс с наибольшим использованием CPU. Проверьте статус службы ssh (или другой службы).',
        },
      ],
    });
    await linuxLesson5.save();

    // Linux Lesson 6
    const linuxLesson6 = new Lesson({
      title: 'Bash scripting основы',
      description: 'Основы написания скриптов на Bash',
      content: `
        <h2>Bash скрипты</h2>
        <p>Bash скрипты позволяют автоматизировать задачи в Linux.</p>
        
        <h3>Создание скрипта:</h3>
        <pre><code>#!/bin/bash
# Это комментарий
echo "Привет, мир!"
</code></pre>
        
        <h3>Переменные:</h3>
        <pre><code>NAME="Иван"
echo $NAME
</code></pre>
        
        <h3>Условия:</h3>
        <pre><code>if [ $VAR -eq 10 ]; then
    echo "Переменная равна 10"
elif [ $VAR -gt 10 ]; then
    echo "Переменная больше 10"
else
    echo "Переменная меньше 10"
fi
</code></pre>
        
        <h3>Циклы:</h3>
        <pre><code>for i in {1..5}; do
    echo "Итерация $i"
done

while [ $count -lt 10 ]; do
    echo $count
    count=$((count + 1))
done
</code></pre>
      `,
      course: linuxCourse._id,
      order: 6,
      duration: 60,
      isPublished: true,
      exercises: [
        {
          title: 'Создание скрипта',
          description: 'Напишите простой Bash скрипт',
          type: 'practical',
          instructions: 'Создайте скрипт backup.sh, который создает копию всех .txt файлов в текущей директории в папку backup. Добавьте проверку существования папки backup и создайте её, если её нет.',
        },
      ],
    });
    await linuxLesson6.save();

    // Linux Lesson 7
    const linuxLesson7 = new Lesson({
      title: 'Сетевые настройки',
      description: 'Настройка сетевых интерфейсов',
      content: `
        <h2>Сетевые настройки</h2>
        <p>В Linux сетевые настройки можно изменять через командную строку.</p>
        
        <h3>Проверка сетевых интерфейсов:</h3>
        <pre><code>ip addr show
ifconfig
ip link show
</code></pre>
        
        <h3>Настройка IP-адреса:</h3>
        <pre><code>sudo ip addr add 192.168.1.100/24 dev eth0
sudo ip link set eth0 up
</code></pre>
        
        <h3>Маршрутизация:</h3>
        <pre><code>ip route show
ip route add default via 192.168.1.1
</code></pre>
        
        <h3>Проверка связности:</h3>
        <pre><code>ping 8.8.8.8
traceroute google.com
netstat -tuln - открытые порты
ss -tuln - современная альтернатива netstat
</code></pre>
      `,
      course: linuxCourse._id,
      order: 7,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка сети',
          description: 'Настройте сетевой интерфейс',
          type: 'practical',
          instructions: 'Проверьте текущие сетевые настройки. Проверьте связность с интернетом (ping 8.8.8.8). Изучите таблицу маршрутизации.',
        },
      ],
    });
    await linuxLesson7.save();

    // Linux Lesson 8
    const linuxLesson8 = new Lesson({
      title: 'Работа с логами',
      description: 'Просмотр и анализ системных логов',
      content: `
        <h2>Системные логи</h2>
        <p>Логи содержат информацию о работе системы и приложений.</p>
        
        <h3>Основные файлы логов:</h3>
        <ul>
          <li><strong>/var/log/syslog</strong> - общий системный лог (Ubuntu)</li>
          <li><strong>/var/log/messages</strong> - системные сообщения (CentOS)</li>
          <li><strong>/var/log/auth.log</strong> - логи аутентификации</li>
          <li><strong>/var/log/apache2/</strong> - логи веб-сервера</li>
        </ul>
        
        <h3>Команды для работы с логами:</h3>
        <pre><code>tail -f /var/log/syslog - следить за логом в реальном времени
tail -n 100 /var/log/syslog - последние 100 строк
head -n 50 /var/log/syslog - первые 50 строк
grep "error" /var/log/syslog - поиск по логу
journalctl - просмотр логов systemd
journalctl -u service_name - логи конкретной службы
</code></pre>
      `,
      course: linuxCourse._id,
      order: 8,
      duration: 40,
      isPublished: true,
      exercises: [
        {
          title: 'Анализ логов',
          description: 'Изучите системные логи',
          type: 'practical',
          instructions: 'Просмотрите последние 50 строк системного лога. Найдите все записи с ошибками за последний час. Изучите логи systemd.',
        },
      ],
    });
    await linuxLesson8.save();

    // Update Linux course
    linuxCourse.lessons = [
      String(linuxLesson1._id),
      String(linuxLesson2._id),
      String(linuxLesson3._id),
      String(linuxLesson4._id),
      String(linuxLesson5._id),
      String(linuxLesson6._id),
      String(linuxLesson7._id),
      String(linuxLesson8._id),
    ] as any;
    await linuxCourse.save();

    // Linux Quizzes
    const linuxQuiz1 = new Quiz({
      title: 'Тест: Введение в Linux',
      description: 'Проверьте знания по основам Linux',
      course: linuxCourse._id,
      lesson: linuxLesson1._id,
      questions: [
        {
          question: 'Что такое Linux?',
          type: 'single',
          options: [
            'Операционная система с закрытым исходным кодом',
            'Операционная система с открытым исходным кодом',
            'Программа для редактирования текста',
            'Язык программирования',
          ],
          correctAnswers: ['Операционная система с открытым исходным кодом'],
          points: 1,
        },
        {
          question: 'Какие дистрибутивы Linux вы знаете?',
          type: 'multiple',
          options: ['Ubuntu', 'Windows', 'CentOS', 'Debian'],
          correctAnswers: ['Ubuntu', 'CentOS', 'Debian'],
          points: 2,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await linuxQuiz1.save();

    const linuxQuiz2 = new Quiz({
      title: 'Тест: Файловая система',
      description: 'Проверьте знания по файловой системе',
      course: linuxCourse._id,
      lesson: linuxLesson2._id,
      questions: [
        {
          question: 'Какая команда используется для просмотра содержимого директории?',
          type: 'single',
          options: ['cd', 'ls', 'pwd', 'mkdir'],
          correctAnswers: ['ls'],
          points: 1,
          explanation: 'Команда ls используется для просмотра списка файлов и директорий.',
        },
        {
          question: 'Что означает символ / в Linux?',
          type: 'single',
          options: ['Корневая директория', 'Домашняя директория', 'Текущая директория', 'Родительская директория'],
          correctAnswers: ['Корневая директория'],
          points: 1,
        },
        {
          question: 'Какая команда создает директорию?',
          type: 'single',
          options: ['mkdir', 'mkfile', 'create', 'newdir'],
          correctAnswers: ['mkdir'],
          points: 1,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await linuxQuiz2.save();

    // Final Linux Quiz
    const linuxFinalQuiz = new Quiz({
      title: 'Итоговый тест: Системное администрирование Linux',
      description: 'Итоговый тест по всему курсу Linux',
      course: linuxCourse._id,
      questions: [
        {
          question: 'Какая команда показывает все запущенные процессы?',
          type: 'single',
          options: ['ps', 'ls', 'top', 'show'],
          correctAnswers: ['ps'],
          points: 2,
        },
        {
          question: 'Что означает chmod 755?',
          type: 'single',
          options: [
            'Владелец: rwx, группа: r-x, остальные: r-x',
            'Владелец: rw-, группа: r--, остальные: r--',
            'Владелец: rwx, группа: rwx, остальные: rwx',
            'Владелец: ---, группа: ---, остальные: ---',
          ],
          correctAnswers: ['Владелец: rwx, группа: r-x, остальные: r-x'],
          points: 3,
        },
        {
          question: 'Какие команды используются для управления пакетами в Ubuntu?',
          type: 'multiple',
          options: ['apt install', 'apt update', 'yum install', 'apt upgrade'],
          correctAnswers: ['apt install', 'apt update', 'apt upgrade'],
          points: 3,
        },
        {
          question: 'Что такое systemd?',
          type: 'text',
          correctAnswers: ['Система инициализации', 'Менеджер служб', 'systemd'],
          points: 2,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await linuxFinalQuiz.save();

    console.log('Created Linux course with 8 lessons and quizzes');

    // ============================================
    // WINDOWS SYSTEM ADMINISTRATION COURSE
    // ============================================
    const windowsCourse = new Course({
      title: 'Системное администрирование Windows Server',
      description:
        'Изучите основы администрирования Windows Server. Научитесь работать с Active Directory, управлять пользователями, настраивать сетевые службы.',
      category: 'system-windows',
      level: 'beginner',
      order: 3,
      isPublished: true,
      lessons: [],
    });
    await windowsCourse.save();
    console.log('Created Windows course');

    // Windows Lesson 1
    const windowsLesson1 = new Lesson({
      title: 'Введение в Windows Server',
      description: 'Знакомство с Windows Server и его возможностями',
      content: `
        <h2>Windows Server</h2>
        <p>Windows Server - это серверная операционная система от Microsoft, предназначенная для управления сетевыми службами и ресурсами в корпоративных сетях.</p>
        
        <h3>Основные возможности:</h3>
        <ul>
          <li>Active Directory - служба каталогов</li>
          <li>DNS и DHCP - сетевые службы</li>
          <li>Файловые службы и общие ресурсы</li>
          <li>Веб-сервер IIS</li>
          <li>Групповые политики</li>
          <li>Hyper-V - виртуализация</li>
        </ul>
        
        <h3>Роли сервера</h3>
        <p>Windows Server использует ролевую модель. Основные роли:</p>
        <ul>
          <li><strong>Domain Controller</strong> - контроллер домена</li>
          <li><strong>DNS Server</strong> - служба DNS</li>
          <li><strong>DHCP Server</strong> - автоматическая выдача IP-адресов</li>
          <li><strong>File Server</strong> - файловый сервер</li>
          <li><strong>Web Server (IIS)</strong> - веб-сервер</li>
        </ul>
      `,
      course: windowsCourse._id,
      order: 1,
      duration: 45,
      isPublished: true,
    });
    await windowsLesson1.save();

    // Windows Lesson 2
    const windowsLesson2 = new Lesson({
      title: 'Active Directory',
      description: 'Основы работы с Active Directory',
      content: `
        <h2>Active Directory</h2>
        <p>Active Directory (AD) - это служба каталогов Microsoft, которая используется для управления пользователями, компьютерами и другими ресурсами в сети.</p>
        
        <h3>Основные понятия:</h3>
        <ul>
          <li><strong>Домен</strong> - логическая группа компьютеров и устройств</li>
          <li><strong>Контроллер домена</strong> - сервер, управляющий доменом</li>
          <li><strong>Пользователь</strong> - учетная запись пользователя</li>
          <li><strong>Группа</strong> - коллекция пользователей</li>
          <li><strong>Организационное подразделение (OU)</strong> - контейнер для организации объектов</li>
          <li><strong>Лес (Forest)</strong> - коллекция доменов</li>
        </ul>
        
        <h3>Управление пользователями</h3>
        <p>Управление пользователями осуществляется через оснастку <strong>Active Directory Users and Computers</strong>.</p>
        <p>Для создания пользователя: правый клик на OU → New → User</p>
        
        <h3>Основные атрибуты пользователя:</h3>
        <ul>
          <li>Имя пользователя (Username)</li>
          <li>Полное имя (Full Name)</li>
          <li>Пароль</li>
          <li>Группы</li>
          <li>Профиль пользователя</li>
        </ul>
      `,
      course: windowsCourse._id,
      order: 2,
      duration: 60,
      isPublished: true,
      exercises: [
        {
          title: 'Создание пользователей в AD',
          description: 'Практикуйтесь в создании пользователей',
          type: 'practical',
          instructions: 'Создайте несколько пользователей в Active Directory. Настройте их права доступа и добавьте в группы. Создайте организационное подразделение для отдела продаж.',
        },
      ],
    });
    await windowsLesson2.save();

    // Windows Lesson 3
    const windowsLesson3 = new Lesson({
      title: 'Групповые политики',
      description: 'Настройка групповых политик Windows',
      content: `
        <h2>Групповые политики (Group Policy)</h2>
        <p>Групповые политики позволяют централизованно управлять настройками компьютеров и пользователей в домене.</p>
        
        <h3>Типы групповых политик:</h3>
        <ul>
          <li><strong>Политики компьютера</strong> - применяются к компьютерам</li>
          <li><strong>Политики пользователя</strong> - применяются к пользователям</li>
        </ul>
        
        <h3>Основные возможности:</h3>
        <ul>
          <li>Управление настройками безопасности</li>
          <li>Установка программ</li>
          <li>Настройка рабочего стола</li>
          <li>Ограничение доступа к функциям системы</li>
          <li>Настройка сетевых параметров</li>
        </ul>
        
        <h3>Создание политики:</h3>
        <p>1. Откройте Group Policy Management</p>
        <p>2. Создайте новую политику или отредактируйте существующую</p>
        <p>3. Настройте необходимые параметры</p>
        <p>4. Свяжите политику с OU или доменом</p>
      `,
      course: windowsCourse._id,
      order: 3,
      duration: 55,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка групповой политики',
          description: 'Создайте и примените групповую политику',
          type: 'practical',
          instructions: 'Создайте групповую политику, которая устанавливает обои рабочего стола для всех пользователей в определенном OU. Примените политику и проверьте результат.',
        },
      ],
    });
    await windowsLesson3.save();

    // Windows Lesson 4
    const windowsLesson4 = new Lesson({
      title: 'DNS и DHCP',
      description: 'Настройка DNS и DHCP серверов',
      content: `
        <h2>DNS (Domain Name System)</h2>
        <p>DNS преобразует доменные имена в IP-адреса.</p>
        
        <h3>Установка DNS роли:</h3>
        <p>Server Manager → Add Roles → DNS Server</p>
        
        <h3>Создание зоны:</h3>
        <p>DNS Manager → New Zone → Forward Lookup Zone</p>
        <p>Укажите имя зоны (например, company.local)</p>
        
        <h2>DHCP (Dynamic Host Configuration Protocol)</h2>
        <p>DHCP автоматически назначает IP-адреса устройствам в сети.</p>
        
        <h3>Установка DHCP роли:</h3>
        <p>Server Manager → Add Roles → DHCP Server</p>
        
        <h3>Настройка области (Scope):</h3>
        <ul>
          <li>Диапазон IP-адресов (например, 192.168.1.100 - 192.168.1.200)</li>
          <li>Маска подсети (255.255.255.0)</li>
          <li>Шлюз по умолчанию (192.168.1.1)</li>
          <li>DNS серверы</li>
          <li>Срок аренды адреса</li>
        </ul>
      `,
      course: windowsCourse._id,
      order: 4,
      duration: 60,
      isPublished: true,
      exercises: [
        {
          title: 'Настройка DHCP',
          description: 'Настройте DHCP сервер',
          type: 'practical',
          instructions: 'Установите роль DHCP Server. Создайте область для сети 192.168.1.0/24 с диапазоном адресов 192.168.1.100-200. Настройте шлюз и DNS серверы. Проверьте работу DHCP на клиентском компьютере.',
        },
      ],
    });
    await windowsLesson4.save();

    // Windows Lesson 5
    const windowsLesson5 = new Lesson({
      title: 'Файловые службы',
      description: 'Настройка общих папок и файловых служб',
      content: `
        <h2>Файловые службы Windows Server</h2>
        <p>Windows Server предоставляет возможности для организации файловых служб и общих ресурсов.</p>
        
        <h3>Создание общей папки:</h3>
        <ol>
          <li>Создайте папку на сервере</li>
          <li>Правый клик → Properties → Sharing</li>
          <li>Нажмите Share и выберите пользователей</li>
          <li>Настройте права доступа (Read, Read/Write)</li>
        </ol>
        
        <h3>Управление правами доступа:</h3>
        <p>Security вкладка в Properties позволяет настроить детальные права:</p>
        <ul>
          <li>Full Control - полный контроль</li>
          <li>Modify - изменение</li>
          <li>Read & Execute - чтение и выполнение</li>
          <li>Read - только чтение</li>
          <li>Write - только запись</li>
        </ul>
        
        <h3>Квотирование дисков:</h3>
        <p>File Server Resource Manager позволяет установить квоты на использование дискового пространства пользователями.</p>
      `,
      course: windowsCourse._id,
      order: 5,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Создание общих папок',
          description: 'Создайте и настройте общие папки',
          type: 'practical',
          instructions: 'Создайте несколько общих папок для разных отделов. Настройте права доступа так, чтобы каждый отдел имел доступ только к своей папке. Создайте общую папку для всех с правами только на чтение.',
        },
      ],
    });
    await windowsLesson5.save();

    // Windows Lesson 6
    const windowsLesson6 = new Lesson({
      title: 'PowerShell основы',
      description: 'Основы работы с PowerShell',
      content: `
        <h2>Windows PowerShell</h2>
        <p>PowerShell - это мощный инструмент командной строки и скриптовый язык для Windows.</p>
        
        <h3>Основные команды (cmdlets):</h3>
        <pre><code>Get-Process - список процессов
Get-Service - список служб
Get-User - список пользователей (AD)
Get-Command - список доступных команд
Get-Help command_name - справка по команде
</code></pre>
        
        <h3>Работа с файлами:</h3>
        <pre><code>Get-ChildItem - список файлов (аналог dir)
Copy-Item source dest - копирование
Move-Item source dest - перемещение
Remove-Item file - удаление
New-Item -Path "C:\\folder" -ItemType Directory - создание папки
</code></pre>
        
        <h3>Переменные и циклы:</h3>
        <pre><code>$name = "Иван"
Write-Host $name

foreach ($item in $list) {
    Write-Host $item
}

for ($i=1; $i -le 10; $i++) {
    Write-Host $i
}
</code></pre>
      `,
      course: windowsCourse._id,
      order: 6,
      duration: 55,
      isPublished: true,
      exercises: [
        {
          title: 'Скрипт PowerShell',
          description: 'Напишите простой скрипт',
          type: 'practical',
          instructions: 'Создайте PowerShell скрипт, который выводит список всех запущенных служб, затем список всех процессов, использующих более 100 МБ памяти.',
        },
      ],
    });
    await windowsLesson6.save();

    // Windows Lesson 7
    const windowsLesson7 = new Lesson({
      title: 'Управление службами',
      description: 'Управление службами Windows',
      content: `
        <h2>Управление службами</h2>
        <p>Службы Windows - это программы, работающие в фоновом режиме.</p>
        
        <h3>Управление через GUI:</h3>
        <p>Services.msc - открывает оснастку управления службами</p>
        
        <h3>Управление через PowerShell:</h3>
        <pre><code>Get-Service - список всех служб
Get-Service -Name "ServiceName" - информация о службе
Start-Service -Name "ServiceName" - запустить службу
Stop-Service -Name "ServiceName" - остановить службу
Restart-Service -Name "ServiceName" - перезапустить
Set-Service -Name "ServiceName" -StartupType Automatic - автозапуск
</code></pre>
        
        <h3>Типы запуска:</h3>
        <ul>
          <li><strong>Automatic</strong> - автоматический запуск</li>
          <li><strong>Manual</strong> - ручной запуск</li>
          <li><strong>Disabled</strong> - отключена</li>
        </ul>
        
        <h3>Проверка статуса:</h3>
        <pre><code>Get-Service | Where-Object {$_.Status -eq "Running"}
Get-Service | Where-Object {$_.Status -eq "Stopped"}
</code></pre>
      `,
      course: windowsCourse._id,
      order: 7,
      duration: 45,
      isPublished: true,
      exercises: [
        {
          title: 'Управление службами',
          description: 'Практикуйтесь в управлении службами',
          type: 'practical',
          instructions: 'Проверьте статус службы Windows Update. Остановите и запустите службу Print Spooler. Найдите все службы, которые запускаются автоматически.',
        },
      ],
    });
    await windowsLesson7.save();

    // Windows Lesson 8
    const windowsLesson8 = new Lesson({
      title: 'Мониторинг и производительность',
      description: 'Мониторинг системы и оптимизация производительности',
      content: `
        <h2>Мониторинг Windows Server</h2>
        <p>Важно отслеживать производительность и состояние сервера.</p>
        
        <h3>Task Manager (Диспетчер задач):</h3>
        <p>Ctrl+Shift+Esc - открывает диспетчер задач</p>
        <p>Показывает: процессы, производительность, сеть, пользователи</p>
        
        <h3>Resource Monitor:</h3>
        <p>resmon.exe - детальный мониторинг ресурсов</p>
        
        <h3>Performance Monitor (perfmon):</h3>
        <p>Позволяет создавать счетчики производительности:</p>
        <ul>
          <li>CPU Usage</li>
          <li>Memory Usage</li>
          <li>Disk I/O</li>
          <li>Network Traffic</li>
        </ul>
        
        <h3>Event Viewer (Просмотр событий):</h3>
        <p>eventvwr.msc - просмотр системных логов</p>
        <p>Категории: Application, System, Security</p>
        
        <h3>PowerShell команды:</h3>
        <pre><code>Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Get-Counter "\\Processor(_Total)\\% Processor Time"
Get-EventLog -LogName System -Newest 50
</code></pre>
      `,
      course: windowsCourse._id,
      order: 8,
      duration: 50,
      isPublished: true,
      exercises: [
        {
          title: 'Мониторинг системы',
          description: 'Изучите инструменты мониторинга',
          type: 'practical',
          instructions: 'Откройте Task Manager и изучите использование ресурсов. Запустите Performance Monitor и добавьте счетчики для CPU и памяти. Просмотрите последние события в Event Viewer.',
        },
      ],
    });
    await windowsLesson8.save();

    // Update Windows course
    windowsCourse.lessons = [
      String(windowsLesson1._id),
      String(windowsLesson2._id),
      String(windowsLesson3._id),
      String(windowsLesson4._id),
      String(windowsLesson5._id),
      String(windowsLesson6._id),
      String(windowsLesson7._id),
      String(windowsLesson8._id),
    ] as any;
    await windowsCourse.save();

    // Windows Quizzes
    const windowsQuiz1 = new Quiz({
      title: 'Тест: Введение в Windows Server',
      description: 'Проверьте знания по Windows Server',
      course: windowsCourse._id,
      lesson: windowsLesson1._id,
      questions: [
        {
          question: 'Что такое Windows Server?',
          type: 'single',
          options: [
            'Операционная система для настольных компьютеров',
            'Серверная операционная система',
            'Веб-браузер',
            'Антивирус',
          ],
          correctAnswers: ['Серверная операционная система'],
          points: 1,
        },
        {
          question: 'Какие роли может выполнять Windows Server?',
          type: 'multiple',
          options: ['Domain Controller', 'DNS Server', 'DHCP Server', 'Web Server'],
          correctAnswers: ['Domain Controller', 'DNS Server', 'DHCP Server', 'Web Server'],
          points: 2,
          explanation: 'Windows Server может выполнять множество ролей, включая все перечисленные.',
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await windowsQuiz1.save();

    const windowsQuiz2 = new Quiz({
      title: 'Тест: Active Directory',
      description: 'Проверьте знания по Active Directory',
      course: windowsCourse._id,
      lesson: windowsLesson2._id,
      questions: [
        {
          question: 'Что такое Active Directory?',
          type: 'single',
          options: [
            'Веб-сервер',
            'Служба каталогов',
            'База данных',
            'Файловый сервер',
          ],
          correctAnswers: ['Служба каталогов'],
          points: 1,
          explanation: 'Active Directory - это служба каталогов Microsoft для управления сетевыми ресурсами.',
        },
        {
          question: 'Что такое OU в Active Directory?',
          type: 'single',
          options: [
            'Организационное подразделение',
            'Операционная единица',
            'Общая учетная запись',
            'Открытый доступ',
          ],
          correctAnswers: ['Организационное подразделение'],
          points: 1,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await windowsQuiz2.save();

    // Final Windows Quiz
    const windowsFinalQuiz = new Quiz({
      title: 'Итоговый тест: Системное администрирование Windows Server',
      description: 'Итоговый тест по всему курсу Windows Server',
      course: windowsCourse._id,
      questions: [
        {
          question: 'Что такое Active Directory?',
          type: 'single',
          options: [
            'Служба каталогов для управления сетевыми ресурсами',
            'Веб-сервер',
            'База данных',
            'Файловый сервер',
          ],
          correctAnswers: ['Служба каталогов для управления сетевыми ресурсами'],
          points: 2,
        },
        {
          question: 'Что делает DHCP?',
          type: 'single',
          options: [
            'Преобразует доменные имена в IP',
            'Автоматически назначает IP-адреса',
            'Управляет пользователями',
            'Настраивает групповые политики',
          ],
          correctAnswers: ['Автоматически назначает IP-адреса'],
          points: 2,
        },
        {
          question: 'Какие типы запуска служб существуют в Windows?',
          type: 'multiple',
          options: ['Automatic', 'Manual', 'Disabled', 'Remote'],
          correctAnswers: ['Automatic', 'Manual', 'Disabled'],
          points: 3,
        },
        {
          question: 'Что такое PowerShell?',
          type: 'text',
          correctAnswers: ['Инструмент командной строки', 'Скриптовый язык', 'PowerShell'],
          points: 2,
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await windowsFinalQuiz.save();

    console.log('Created Windows course with 8 lessons and quizzes');
    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();

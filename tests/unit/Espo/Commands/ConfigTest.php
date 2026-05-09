<?php
/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM – Open Source CRM application.
 * Copyright (C) 2014-2026 EspoCRM, Inc.
 * Website: https://www.espocrm.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU Affero General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU Affero General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

namespace tests\unit\Espo\Commands;

use Espo\Classes\ConsoleCommands\GetConfigParam;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Utils\Config;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ConfigTest extends TestCase
{
    public function testGetParamNoParam(): void
    {
        $params = new Params(
            options: [],
            flagList: [],
            argumentList: [],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $this->expectIoError($io);

        (new GetConfigParam($config))->run($params, $io);
    }

    public function testGetParamNonExistingParam(): void
    {
        $params = new Params(
            options: [],
            flagList: [],
            argumentList: ['test'],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $config
            ->method('has')
            ->with('test')
            ->willReturn(false);

        $this->expectIoError($io);

        (new GetConfigParam($config))->run($params, $io);
    }

    public function testGetParamExisting(): void
    {
        $params = new Params(
            options: [],
            flagList: [],
            argumentList: ['test'],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $config
            ->method('has')
            ->with('test')
            ->willReturn(true);

        $config
            ->method('get')
            ->with('test')
            ->willReturn('hello');

        $this->expectIoNoError($io);

        $io->expects($this->once())
            ->method('writeLine')
            ->with('hello');

        (new GetConfigParam($config))->run($params, $io);
    }

    public function testGetParamJson(): void
    {
        $params = new Params(
            options: [],
            flagList: ['json'],
            argumentList: ['test'],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $config
            ->method('has')
            ->with('test')
            ->willReturn(true);

        $config
            ->method('get')
            ->with('test')
            ->willReturn('hello');

        $this->expectIoNoError($io);

        $io->expects($this->once())
            ->method('writeLine')
            ->with('"hello"');

        (new GetConfigParam($config))->run($params, $io);
    }

    public function testGetParamTrue(): void
    {
        $params = new Params(
            options: [],
            flagList: [],
            argumentList: ['test'],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $config
            ->method('has')
            ->with('test')
            ->willReturn(true);

        $config
            ->method('get')
            ->with('test')
            ->willReturn(true);

        $this->expectIoNoError($io);

        $io->expects($this->once())
            ->method('writeLine')
            ->with('true');

        (new GetConfigParam($config))->run($params, $io);
    }

    public function testGetParamFalse(): void
    {
        $params = new Params(
            options: [],
            flagList: [],
            argumentList: ['test'],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $config
            ->method('has')
            ->with('test')
            ->willReturn(true);

        $config
            ->method('get')
            ->with('test')
            ->willReturn(false);

        $this->expectIoNoError($io);

        $io->expects($this->once())
            ->method('writeLine')
            ->with('false');

        (new GetConfigParam($config))->run($params, $io);
    }

    public function testGetParamNull(): void
    {
        $params = new Params(
            options: [],
            flagList: [],
            argumentList: ['test'],
        );

        $io = $this->createMock(IO::class);
        $config = $this->createMock(Config::class);

        $config
            ->method('has')
            ->with('test')
            ->willReturn(true);

        $config
            ->method('get')
            ->with('test')
            ->willReturn(null);

        $this->expectIoNoError($io);

        $io->expects($this->once())
            ->method('writeLine')
            ->with('null');

        (new GetConfigParam($config))->run($params, $io);
    }


    private function expectIoError(IO & MockObject $io): void
    {
        $io->expects($this->once())
            ->method('setExitStatus')
            ->with(1);
    }

    private function expectIoNoError(IO & MockObject $io): void
    {
        $io->expects($this->never())
            ->method('setExitStatus');
    }
}

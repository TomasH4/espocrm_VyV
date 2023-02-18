<?php
/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2023 Yurii Kuznietsov, Taras Machyshyn, Oleksii Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

namespace Espo\Core\Api;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ResponseInterface as Psr7Response;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ResponseFactory;

/**
 * @internal
 */
class ActionHandler implements RequestHandlerInterface
{
    private const DEFAULT_CONTENT_TYPE = 'application/json';

    public function __construct(
        private Action $action,
        private ProcessData $processData
    ) {}

    /**
     * @throws BadRequest
     * @throws Forbidden
     * @throws Error
     * @throws NotFound
     */
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $requestWrapped = new RequestWrapper(
            $request,
            $this->processData->getBasePath(),
            $this->processData->getRouteParams()
        );

        $response = $this->action->process($requestWrapped);

        return $this->prepareResponse($response);
    }

    private function prepareResponse(Response $response): Psr7Response
    {
        $psr7Response = $response instanceof ResponseWrapper ?
            $response->toPsr7() :
            self::responseToPsr7($response);

        if (!$psr7Response->getHeader('Content-Type')) {
            $psr7Response = $psr7Response->withHeader('Content-Type', self::DEFAULT_CONTENT_TYPE);
        }

        return $psr7Response;
    }

    private static function responseToPsr7(Response $response): Psr7Response
    {
        $psr7Response = (new ResponseFactory())->createResponse();

        $statusCode = $response->getStatusCode();
        $reason = $response->getReasonPhrase();
        $body = $response->getBody();

        $psr7Response = $psr7Response
            ->withStatus($statusCode, $reason)
            ->withBody($body);

        foreach ($response->getHeaderNames() as $name) {
            $psr7Response = $psr7Response->withHeader($name, $response->getHeaderAsArray($name));
        }

        return $psr7Response;
    }
}

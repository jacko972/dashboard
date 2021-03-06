// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import DeployFromFileController from 'deploy/deployfromfile_controller';
import deployModule from 'deploy/deploy_module';

describe('DeployFromFile controller', () => {
  /** @type {!DeployFromFileController} */
  let ctrl;
  /** @type {!angular.$resource} */
  let mockResource;
  /** @type {!angular.$resource} */
  let resource;
  /** @type {!angular.FormController} */
  let form;
  /** @type {!angular.$httpBackend} */
  let httpBackend;
  beforeEach(() => {
    angular.mock.module(deployModule.name);

    angular.mock.inject(($controller, $httpBackend, $resource) => {
      mockResource = jasmine.createSpy('$resource');
      resource = $resource;
      form = {
        $valid: true,
      };
      ctrl = $controller(DeployFromFileController, {$resource: mockResource}, {form: form});
      httpBackend = $httpBackend;
    });
  });

  it('should deploy with file name and content', () => {
    // given
    let resourceObject = {
      save: jasmine.createSpy('save'),
    };
    ctrl.file.name = 'test.yaml';
    ctrl.file.content = 'test_content';
    mockResource.and.returnValue(resourceObject);
    resourceObject.save.and.callFake((spec) => {
      // then
      expect(spec.name).toBe('test.yaml');
      expect(spec.content).toBe('test_content');
    });
    // when
    ctrl.deploy();

    // then
    expect(resourceObject.save).toHaveBeenCalled();
  });

  it('should open error dialog and redirect the page', () => {
    spyOn(ctrl.errorDialog_, 'open');
    spyOn(ctrl.kdHistoryService_, 'back');
    let response = {
      name: 'foo-name',
      content: 'foo-content',
      error: 'service already exists',
    };
    httpBackend.expectPOST('api/v1/appdeploymentfromfile').respond(201, response);
    mockResource.and.callFake(resource);
    expect(ctrl.isDeployDisabled()).toBe(false);
    ctrl.deploy();
    expect(ctrl.isDeployDisabled()).toBe(true);
    httpBackend.flush();
    expect(ctrl.isDeployDisabled()).toBe(false);

    // then
    expect(ctrl.errorDialog_.open).toHaveBeenCalled();
    expect(ctrl.kdHistoryService_.back).toHaveBeenCalled();
  });

  it('should redirect the page and not open error dialog', () => {
    spyOn(ctrl.errorDialog_, 'open');
    spyOn(ctrl.kdHistoryService_, 'back');
    mockResource.and.callFake(resource);
    let response = {
      name: 'foo-name',
      content: 'foo-content',
      error: '',
    };
    httpBackend.expectPOST('api/v1/appdeploymentfromfile').respond(201, response);
    // when
    ctrl.deploy();
    httpBackend.flush();

    // then
    expect(ctrl.errorDialog_.open).not.toHaveBeenCalled();
    expect(ctrl.kdHistoryService_.back).toHaveBeenCalled();
  });

  it('should not redirect the page and but open error dialog', () => {
    spyOn(ctrl.errorDialog_, 'open');
    spyOn(ctrl.kdHistoryService_, 'back');
    mockResource.and.callFake(resource);
    httpBackend.expectPOST('api/v1/appdeploymentfromfile').respond(500, 'Deployment failed');
    // when
    ctrl.deploy();
    httpBackend.flush();

    // then
    expect(ctrl.errorDialog_.open).toHaveBeenCalled();
    expect(ctrl.kdHistoryService_.back).not.toHaveBeenCalled();
  });

  it('should cancel', () => {
    spyOn(ctrl.kdHistoryService_, 'back');
    ctrl.cancel();
    expect(ctrl.kdHistoryService_.back).toHaveBeenCalled();
  });
});
